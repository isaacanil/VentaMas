function fetchInstallment(user, arId) {
    
  return db.collection("installment").get();
}