// Maps an axios error to a specific, user-displayable Arabic message key.
// Pass the result through t() when rendering so English mode translates it.
//
// The goal: the user must always be told WHAT went wrong (no connection,
// timeout, expired session, exact server rejection...) — never a vague
// "something went wrong" when we know more.

const KNOWN_SERVER_MESSAGES: Record<string, string> = {
  "Add some seeders or water first": "أضف كمية من الماء أو السماد أولاً.",
  "Invalid water or seeders quantity": "الكمية المطلوبة غير صحيحة.",
  "Insufficient snabel balance": "رصيد السنابل غير كافٍ.",
  "Student not found": "لم يتم العثور على حساب الطالب.",
  "Not enough seeders or water to grow the tree":
    "لا تملك ماءً أو سمادًا كافيًا لتكبير الشجرة.",
  "You have reached the maximum tree level!":
    "وصلت شجرتك إلى أعلى مستوى، تهانينا!",
  "Tree data not found": "بيانات الشجرة غير متوفرة حاليًا.",
};

export const describeApiError = (error: any): string => {
  if (error?.code === "ECONNABORTED") {
    return "انتهت مهلة الطلب. تحقق من سرعة الإنترنت وحاول مرة أخرى.";
  }

  if (!error?.response) {
    return "لا يمكن الوصول إلى الخادم. تحقق من اتصالك بالإنترنت.";
  }

  const status: number = error.response.status;
  const serverMessage = String(
    error.response.data?.error || error.response.data?.message || "",
  );

  if (KNOWN_SERVER_MESSAGES[serverMessage]) {
    return KNOWN_SERVER_MESSAGES[serverMessage];
  }

  if (status === 401 || status === 403) {
    return "انتهت صلاحية جلستك. سجل الدخول مرة أخرى.";
  }

  if (status >= 500) {
    return "حدث خطأ في الخادم. حاول مرة أخرى بعد قليل.";
  }

  // Unknown but specific server text beats hiding the reason entirely.
  if (serverMessage) {
    return serverMessage;
  }

  return "حدث خطأ غير متوقع. حاول مرة أخرى.";
};
