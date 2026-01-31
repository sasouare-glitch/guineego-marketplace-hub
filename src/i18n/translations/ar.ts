import type { TranslationKeys } from "./fr";

export const ar: TranslationKeys = {
  // Common
  common: {
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    save: "حفظ",
    cancel: "إلغاء",
    delete: "حذف",
    edit: "تعديل",
    add: "إضافة",
    search: "بحث",
    filter: "تصفية",
    sort: "ترتيب",
    all: "الكل",
    none: "لا شيء",
    yes: "نعم",
    no: "لا",
    back: "رجوع",
    next: "التالي",
    previous: "السابق",
    submit: "إرسال",
    close: "إغلاق",
    viewAll: "عرض الكل",
    seeMore: "عرض المزيد",
  },

  // Navigation
  nav: {
    home: "الرئيسية",
    marketplace: "السوق",
    academy: "الأكاديمية",
    cart: "السلة",
    orders: "طلباتي",
    profile: "ملفي الشخصي",
    wishlist: "المفضلة",
    settings: "الإعدادات",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
  },

  // Home page
  home: {
    heroTitle: "توصيل سريع في كوناكري",
    heroSubtitle: "اطلب منتجاتك المفضلة واستلمها في أقل من ساعتين",
    shopNow: "تسوق الآن",
    becomeSeller: "كن بائعاً",
    features: "المميزات",
    categories: "الفئات",
    partners: "شركاؤنا",
  },

  // Marketplace
  marketplace: {
    title: "السوق",
    flashSales: "عروض سريعة",
    newArrivals: "وصل حديثاً",
    bestSellers: "الأكثر مبيعاً",
    recommended: "موصى لك",
    addToCart: "أضف للسلة",
    addedToCart: "أُضيف للسلة",
    outOfStock: "نفذ المخزون",
    inStock: "متوفر",
    freeDelivery: "توصيل مجاني",
    filters: "التصفية",
    priceRange: "نطاق السعر",
    category: "الفئة",
    rating: "التقييم",
    sortBy: "ترتيب حسب",
    relevance: "الملاءمة",
    priceLowHigh: "السعر: من الأقل للأعلى",
    priceHighLow: "السعر: من الأعلى للأقل",
    newest: "الأحدث",
  },

  // Product
  product: {
    description: "الوصف",
    specifications: "المواصفات",
    reviews: "التقييمات",
    relatedProducts: "منتجات مشابهة",
    quantity: "الكمية",
    addToWishlist: "أضف للمفضلة",
    removeFromWishlist: "إزالة من المفضلة",
    shareProduct: "مشاركة",
    sellerInfo: "معلومات البائع",
    deliveryInfo: "معلومات التوصيل",
  },

  // Cart
  cart: {
    title: "سلتي",
    empty: "سلتك فارغة",
    emptyMessage: "اكتشف منتجاتنا وأضفها إلى سلتك",
    continueShopping: "متابعة التسوق",
    subtotal: "المجموع الفرعي",
    delivery: "التوصيل",
    total: "الإجمالي",
    checkout: "إتمام الشراء",
    remove: "إزالة",
    freeDeliveryFrom: "توصيل مجاني من",
  },

  // Checkout
  checkout: {
    title: "إتمام الطلب",
    step1: "عنوان التوصيل",
    step2: "الدفع",
    step3: "التأكيد",
    deliveryAddress: "عنوان التوصيل",
    paymentMethod: "طريقة الدفع",
    orderSummary: "ملخص الطلب",
    placeOrder: "تأكيد الطلب",
    orderConfirmed: "تم تأكيد الطلب",
    orderNumber: "رقم الطلب",
    estimatedDelivery: "التوصيل المتوقع",
    trackOrder: "تتبع طلبي",
  },

  // Orders
  orders: {
    title: "طلباتي",
    noOrders: "لا توجد طلبات",
    noOrdersMessage: "لم تقم بأي طلب بعد",
    orderDate: "تاريخ الطلب",
    status: "الحالة",
    items: "المنتجات",
    trackOrder: "تتبع",
    cancelOrder: "إلغاء",
    reorder: "إعادة الطلب",
    statusPending: "قيد الانتظار",
    statusConfirmed: "مؤكد",
    statusPreparing: "قيد التحضير",
    statusShipped: "تم الشحن",
    statusDelivered: "تم التوصيل",
    statusCancelled: "ملغي",
  },

  // Profile
  profile: {
    title: "ملفي الشخصي",
    personalInfo: "المعلومات الشخصية",
    firstName: "الاسم الأول",
    lastName: "اسم العائلة",
    email: "البريد الإلكتروني",
    phone: "الهاتف",
    savedAddresses: "العناوين المحفوظة",
    addAddress: "إضافة عنوان",
    defaultAddress: "العنوان الافتراضي",
    setAsDefault: "تعيين كافتراضي",
  },

  // Settings
  settings: {
    title: "الإعدادات",
    notifications: "الإشعارات",
    notificationsDesc: "إدارة تفضيلات الإشعارات",
    security: "الأمان",
    securityDesc: "كلمة المرور والمصادقة",
    preferences: "التفضيلات",
    preferencesDesc: "اللغة والمظهر والعملة",
    language: "اللغة",
    theme: "المظهر",
    themeDark: "داكن",
    themeLight: "فاتح",
    themeSystem: "النظام",
    currency: "العملة",
    currencyNote: "سيتم تحويل الأسعار تقريبياً",
  },

  // Wishlist
  wishlist: {
    title: "المفضلة",
    empty: "لا توجد مفضلات",
    emptyMessage: "أضف منتجات إلى مفضلتك لتجدها بسهولة",
    addAllToCart: "أضف الكل للسلة",
    clearAll: "مسح الكل",
  },

  // Notifications
  notifications: {
    title: "الإشعارات",
    empty: "لا توجد إشعارات",
    markAllRead: "تحديد الكل كمقروء",
    clearAll: "مسح الكل",
    enablePush: "تفعيل إشعارات الدفع",
    pushEnabled: "مفعّل",
    pushBlocked: "محظور",
  },

  // Footer
  footer: {
    about: "حولنا",
    contact: "اتصل بنا",
    terms: "شروط الاستخدام",
    privacy: "سياسة الخصوصية",
    help: "المساعدة",
    faq: "الأسئلة الشائعة",
    careers: "الوظائف",
    copyright: "جميع الحقوق محفوظة",
  },

  // Time
  time: {
    minutesAgo: "منذ {count} دقيقة",
    hoursAgo: "منذ {count} ساعة",
    daysAgo: "منذ {count} يوم",
    today: "اليوم",
    yesterday: "أمس",
  },
};
