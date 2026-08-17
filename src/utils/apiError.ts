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

  // Admin API rejections. These Arabic strings are i18n keys; en.ts contains
  // their English equivalents, so callers should display t(describeApiError()).
  "User data not found in request": "بيانات المستخدم غير موجودة في الطلب.",
  "Admin not found": "لم يتم العثور على حساب المسؤول.",
  "Invalid organization id": "معرّف المدرسة غير صالح.",
  "Organization not found": "لم يتم العثور على المدرسة.",
  "name is required": "الاسم مطلوب.",
  "Organization with this name already exists":
    "توجد مدرسة بهذا الاسم بالفعل.",
  "Organization has dependent records, reassign or remove them first":
    "لا يمكن حذف المدرسة لوجود بيانات مرتبطة بها. أعد تعيينها أو احذفها أولاً.",
  "Student ID is required": "معرّف الطالب مطلوب.",
  "Invalid student id": "معرّف الطالب غير صالح.",
  "Target organization does not exist": "المدرسة المحددة غير موجودة.",
  "Target class does not exist": "الفصل المحدد غير موجود.",
  "Target class does not belong to the student's organization":
    "الفصل المحدد لا يتبع مدرسة الطالب.",
  "Target class does not belong to the selected organization":
    "الفصل المحدد لا يتبع المدرسة المختارة.",
  "Target grade does not exist": "المرحلة الدراسية المحددة غير موجودة.",
  "Email already in use": "البريد الإلكتروني مستخدم بالفعل.",
  "firstName, email and role are required":
    "الاسم الأول والبريد الإلكتروني ونوع الحساب مطلوبة.",
  "role must be one of Student, Teacher, Parent, Admin":
    "نوع الحساب يجب أن يكون طالبًا أو معلمًا أو ولي أمر أو مسؤولًا.",
  "organizationId is required for this role":
    "اختيار المدرسة مطلوب لهذا النوع من الحسابات.",
  "Invalid user id": "معرّف المستخدم غير صالح.",
  "User not found": "لم يتم العثور على المستخدم.",
  "Student record not found for this user":
    "لم يتم العثور على سجل طالب لهذا المستخدم.",
  "Teacher record not found for this user":
    "لم يتم العثور على سجل معلم لهذا المستخدم.",
  "classIds must be an array": "قائمة معرّفات الفصول غير صالحة.",
  "classname, gradeId and organizationId are required":
    "اسم الفصل والمرحلة الدراسية والمدرسة مطلوبة.",
  "Invalid class id": "معرّف الفصل غير صالح.",
  "Class not found": "لم يتم العثور على الفصل.",
  "Class has students assigned, reassign or remove them first":
    "لا يمكن حذف الفصل لوجود طلاب مسجلين فيه. أعد تعيينهم أو احذفهم أولاً.",
  "Grade already exists in this school":
    "المرحلة الدراسية موجودة بالفعل في هذه المدرسة.",
  "Invalid grade id": "معرّف المرحلة الدراسية غير صالح.",
  "Grade not found": "لم يتم العثور على المرحلة الدراسية.",
  "name must be a non-empty string": "يجب إدخال اسم غير فارغ.",
  "Grade name already exists in this school":
    "اسم المرحلة الدراسية موجود بالفعل في هذه المدرسة.",
  "Grade has students or classes assigned, reassign or remove them first":
    "لا يمكن حذف المرحلة الدراسية لوجود طلاب أو فصول مرتبطة بها. أعد تعيينها أو احذفها أولاً.",
};

type ErrorTranslator = (
  key: string,
  options?: Record<string, string>,
) => string;

interface DynamicServerMessage {
  key: string;
  options: Record<string, string>;
}

const translateDynamicServerMessage = (
  message: string,
): DynamicServerMessage | undefined => {
  const missingClass = message.match(/^Class (\d+) does not exist$/);
  if (missingClass) {
    return {
      key: "الفصل رقم {{number}} غير موجود.",
      options: { number: missingClass[1] },
    };
  }

  const wrongOrganization = message.match(
    /^Class (\d+) does not belong to the selected organization$/,
  );
  if (wrongOrganization) {
    return {
      key: "الفصل رقم {{number}} لا يتبع المدرسة المختارة.",
      options: { number: wrongOrganization[1] },
    };
  }

  const invalidOptionalId = message.match(
    /^(\w+) must be a positive integer, null, or an empty value$/,
  );
  if (invalidOptionalId) {
    return {
      key: "قيمة {{field}} يجب أن تكون رقمًا صحيحًا موجبًا أو فارغة.",
      options: { field: invalidOptionalId[1] },
    };
  }

  return undefined;
};

export const describeApiError = (
  error: any,
  translate?: ErrorTranslator,
): string => {
  const translated = (key: string, options?: Record<string, string>) =>
    translate ? translate(key, options) : key.replace(
      /{{(\w+)}}/g,
      (_, name: string) => options?.[name] ?? `{{${name}}}`,
    );

  if (error?.code === "ECONNABORTED") {
    return translated("انتهت مهلة الطلب. تحقق من سرعة الإنترنت وحاول مرة أخرى.");
  }

  if (!error?.response) {
    return translated("لا يمكن الوصول إلى الخادم. تحقق من اتصالك بالإنترنت.");
  }

  const status: number = error.response.status;
  const serverMessage = String(
    error.response.data?.error || error.response.data?.message || "",
  );

  const knownServerMessage = KNOWN_SERVER_MESSAGES[serverMessage];
  if (knownServerMessage) {
    return translated(knownServerMessage);
  }

  const dynamicServerMessage = translateDynamicServerMessage(serverMessage);
  if (dynamicServerMessage) {
    return translated(dynamicServerMessage.key, dynamicServerMessage.options);
  }

  if (status === 401 || status === 403) {
    return translated("انتهت صلاحية جلستك. سجل الدخول مرة أخرى.");
  }

  if (status >= 500) {
    return translated("حدث خطأ في الخادم. حاول مرة أخرى بعد قليل.");
  }

  // Unknown but specific server text beats hiding the reason entirely.
  if (serverMessage) {
    return serverMessage;
  }

  return translated("حدث خطأ غير متوقع. حاول مرة أخرى.");
};
