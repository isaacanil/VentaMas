import { onRequest } from 'firebase-functions/v2/https';
import crypto from 'node:crypto';

import { db, FieldValue } from '../../../../core/config/firebase.js';
import {
  assignSubscriptionToBillingAccount,
  getActiveSubscriptionForBillingAccount,
} from '../services/subscriptionSnapshot.service.js';
import { toCleanString } from '../utils/billingCommon.util.js';

const CHECKOUT_SESSIONS_SUBCOLLECTION = 'checkoutSessions';
const AUTH_HASH_HEX_PATTERN = /^[a-f0-9]{128}$/i;

const isApprovedAzulPayment = ({ responseCode, isoCode }) =>
  responseCode === 'ISO8583' && isoCode === '00';

const resolvePaymentStatus = ({
  approved,
  responseMessage,
  errorDescription,
}) => {
  if (approved) return 'paid';

  const normalizedMessage =
    `${toCleanString(responseMessage) || ''} ${toCleanString(errorDescription) || ''}`
      .toLowerCase();
  if (normalizedMessage.includes('cancel')) return 'void';
  return 'failed';
};

const resolveAmountFromGateway = (rawAmount) => {
  const amountNumber = Number(rawAmount);
  if (!Number.isFinite(amountNumber) || amountNumber <= 0) return 0;
  return amountNumber / 100;
};

const amountsMatch = (receivedAmount, expectedAmount) => {
  const received = Number(receivedAmount);
  const expected = Number(expectedAmount);
  if (!Number.isFinite(received) || !Number.isFinite(expected)) return false;
  return Math.abs(received - expected) < 0.01;
};

const resolveCheckoutSessionRef = ({ billingAccountId, orderNumber }) => {
  const normalizedBillingAccountId = toCleanString(billingAccountId);
  const normalizedOrderNumber = toCleanString(orderNumber);
  if (!normalizedBillingAccountId || !normalizedOrderNumber) return null;

  return db
    .doc(`billingAccounts/${normalizedBillingAccountId}`)
    .collection(CHECKOUT_SESSIONS_SUBCOLLECTION)
    .doc(normalizedOrderNumber);
};

const timingSafeEqualHex = (expected, received) => {
  if (!AUTH_HASH_HEX_PATTERN.test(expected) || !AUTH_HASH_HEX_PATTERN.test(received)) {
    return false;
  }

  const expectedBuffer = Buffer.from(expected, 'hex');
  const receivedBuffer = Buffer.from(received, 'hex');
  return (
    expectedBuffer.length === receivedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, receivedBuffer)
  );
};

export const azulWebhookAuth2 = onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).send('Method Not Allowed');
      return;
    }

    const payload = req.body || req.query || {};

    const orderNumber = toCleanString(payload.OrderNumber) || '';
    const amount = toCleanString(payload.Amount) || '';
    const authorizationCode = toCleanString(payload.AuthorizationCode) || '';
    const dateTime = toCleanString(payload.DateTime) || '';
    const responseCode = toCleanString(payload.ResponseCode) || '';
    const isoCode = toCleanString(payload.ISOCode) || '';
    const responseMessage = toCleanString(payload.ResponseMessage) || '';
    const errorDescription = toCleanString(payload.ErrorDescription) || '';
    const rrn = toCleanString(payload.RRN) || '';
    const receivedAuthHash = toCleanString(payload.AuthHash) || '';

    // Custom fields passed via Checkout
    const billingAccountId = toCleanString(payload.CustomField1) || ''; // billingAccountId
    const businessId = toCleanString(payload.CustomField2) || ''; // businessId

    const authKey = toCleanString(process.env.BILLING_AZUL_AUTH_KEY) || '';
    if (!authKey) {
      console.error('Azul webhook auth key is not configured');
      res.status(500).send('Webhook not configured');
      return;
    }

    if (!AUTH_HASH_HEX_PATTERN.test(receivedAuthHash)) {
      console.error('Invalid Auth2 Hash format from Azul webhook', {
        orderNumber,
        billingAccountId,
      });
      res.status(400).send('Invalid Signature');
      return;
    }

    // Auth2 Hash generation: OrderNumber + Amount + AuthorizationCode + DateTime + ResponseCode + ISOCode + ResponseMessage + ErrorDescription + RRN
    const stringToHash = `${orderNumber}${amount}${authorizationCode}${dateTime}${responseCode}${isoCode}${responseMessage}${errorDescription}${rrn}`;
    const computedHash = crypto
      .createHmac('sha512', authKey)
      .update(stringToHash)
      .digest('hex');

    if (!timingSafeEqualHex(computedHash, receivedAuthHash)) {
      console.error('Invalid Auth2 Hash from Azul webhook', {
        orderNumber,
        billingAccountId,
      });
      res.status(400).send('Invalid Signature');
      return;
    }

    const isApproved = isApprovedAzulPayment({ responseCode, isoCode });
    const paymentStatus = resolvePaymentStatus({
      approved: isApproved,
      responseMessage,
      errorDescription,
    });
    const amountNum = resolveAmountFromGateway(amount);
    const checkoutSessionRef = resolveCheckoutSessionRef({
      billingAccountId,
      orderNumber,
    });
    if (!checkoutSessionRef) {
      console.error('Missing Azul checkout binding', {
        orderNumber,
        billingAccountId,
        businessId,
      });
      res.status(400).send('Invalid Checkout Session');
      return;
    }

    const checkoutSessionSnap = await checkoutSessionRef.get();
    if (!checkoutSessionSnap.exists) {
      console.error('Unknown Azul checkout session', {
        orderNumber,
        billingAccountId,
        businessId,
      });
      res.status(404).send('Unknown Checkout Session');
      return;
    }

    const checkoutSession = checkoutSessionSnap.data() || {};
    const checkoutBusinessId = toCleanString(checkoutSession.businessId);
    const checkoutBillingAccountId = toCleanString(
      checkoutSession.billingAccountId,
    );
    const checkoutProvider = toCleanString(
      checkoutSession.provider,
    )?.toLowerCase();
    const checkoutAmount = Number(checkoutSession.amount);
    if (
      checkoutBusinessId !== businessId ||
      checkoutBillingAccountId !== billingAccountId ||
      (checkoutProvider && checkoutProvider !== 'azul') ||
      !amountsMatch(amountNum, checkoutAmount)
    ) {
      console.error('Azul checkout binding mismatch', {
        orderNumber,
        billingAccountId,
        businessId,
        checkoutBillingAccountId,
        checkoutBusinessId,
        checkoutProvider,
        amountNum,
        checkoutAmount,
      });
      res.status(400).send('Checkout Binding Mismatch');
      return;
    }

    const requestedPlanCode = toCleanString(checkoutSession.planCode);
    const previousCheckoutStatus = toCleanString(
      checkoutSession.status,
    )?.toLowerCase();

    if (billingAccountId) {
      const paymentRef = db
        .doc(`billingAccounts/${billingAccountId}`)
        .collection('paymentHistory')
        .doc(orderNumber);

      await paymentRef.set(
        {
          paymentId: paymentRef.id,
          amount: amountNum,
          currency: 'DOP',
          provider: 'azul',
          status: paymentStatus,
          description: isApproved
            ? `Pago procesado vía Azul (Order: ${orderNumber})`
            : `Pago no aprobado vía Azul (Order: ${orderNumber})`,
          reference: authorizationCode,
          source: 'webhook',
          metadata: {
            orderNumber,
            rrn,
            businessId,
            requestedPlanCode,
            responseCode,
            isoCode,
            responseMessage,
            errorDescription,
          },
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (checkoutSessionRef) {
      await checkoutSessionRef.set(
        {
          status: paymentStatus,
          authorizationCode: authorizationCode || null,
          rrn: rrn || null,
          responseCode: responseCode || null,
          isoCode: isoCode || null,
          responseMessage: responseMessage || null,
          errorDescription: errorDescription || null,
          paidAmount: amountNum,
          updatedAt: FieldValue.serverTimestamp(),
          processedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    if (isApproved && billingAccountId && previousCheckoutStatus !== 'paid') {
      const currentSubscription = await getActiveSubscriptionForBillingAccount(
        billingAccountId,
      );
      const planCode =
        requestedPlanCode || toCleanString(currentSubscription?.planId) || 'legacy';

      await assignSubscriptionToBillingAccount({
        billingAccountId,
        planCode,
        status: 'active',
        scope: 'account',
        provider: 'azul',
        actorUserId: 'system:azulWebhookAuth2',
        note: `Pago aprobado vía Azul (Order: ${orderNumber})`,
      });
    } else if (!isApproved) {
      console.warn('Payment not approved by Azul', {
        responseCode,
        isoCode,
        responseMessage,
      });
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Error processing Azul webhook', error);
    res.status(500).send('Internal Server Error');
  }
});
