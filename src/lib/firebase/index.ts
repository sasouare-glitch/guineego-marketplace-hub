/**
 * Firebase Library Index
 * Re-export all Firebase utilities
 */

// Configuration
export { 
  app, 
  auth, 
  db, 
  storage, 
  functions,
  googleProvider,
  facebookProvider,
  callFunction 
} from './config';

// Authentication
export {
  AuthProvider,
  useAuth,
  useCurrentUserRole,
  useRequireAuth,
  type UserRole,
  type UserClaims,
  type UserProfile
} from './auth';

// Queries
export {
  fetchDocument,
  fetchDocuments,
  fetchPaginatedDocuments,
  useFirestoreDoc,
  useFirestoreQuery,
  useFirestoreInfinite,
  useRealtimeDoc,
  useRealtimeCollection,
  useDocumentListener,
  type FirestoreDoc,
  type PaginatedResult
} from './queries';

// Mutations
export {
  addDocument,
  setDocument,
  updateDocument,
  deleteDocument,
  updateStockAtomic,
  useAddDocument,
  useUpdateDocument,
  useDeleteDocument,
  useOptimisticUpdate,
  useCloudFunction
} from './mutations';

// Storage
export {
  compressImage,
  uploadFile,
  uploadProductImage,
  uploadAvatar,
  deleteFile,
  useFileUpload,
  useProductImageUpload
} from './storage';

// Safe snapshot utility
export { safeOnSnapshot } from './safeSnapshot';
