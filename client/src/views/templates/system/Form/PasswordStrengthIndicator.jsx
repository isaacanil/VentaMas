import React, { useState } from "react";
import styled from "styled-components";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faTimes } from "@fortawesome/free-solid-svg-icons";

const PasswordCriteria = styled.div`
  display: flex;
  align-items: center;
  color: #666666;
`;

const PasswordCheck = styled(FontAwesomeIcon)`
  margin-right: 8px;
  color: ${(props) => (props.pass ? "green" : "red")};
`;

const PasswordStrengthIndicator = ({ password, confirmPassword }) => {

  const hasLowerCase = password.toUpperCase() !== password;
  const hasUpperCase = password.toLowerCase() !== password;
  const isLongEnough = password.length >= 8;
  const isMatch = password === confirmPassword;
  const hasNumber = /\d/.test(password);
  const isPassEmpty = password === ""
  const isConfirmPassEmpty = confirmPassword === ""

  return (
    !isPassEmpty && <div>


      {!hasLowerCase && <PasswordCriteria>
        <PasswordCheck icon={hasLowerCase && hasUpperCase ? faCheck : faTimes} pass={hasLowerCase} />
        Letra mayuscula y minuscula.
      </PasswordCriteria>}
      {!isLongEnough && <PasswordCriteria>
        <PasswordCheck icon={isLongEnough ? faCheck : faTimes} pass={isLongEnough} />
        Tiene al menos 8 caracteres
      </PasswordCriteria>}
      {!hasNumber && <PasswordCriteria>
        <PasswordCheck icon={hasNumber ? faCheck : faTimes} pass={hasNumber} />
        Tiene al menos un número
      </PasswordCriteria>}

    
    </div>
  );
};

export default PasswordStrengthIndicator;
