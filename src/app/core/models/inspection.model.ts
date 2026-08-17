export type InspectionStatus = 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELED';
export type InspectionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Conformity = 'NOT_APPLICABLE' | 'CONFORMING' | 'NON_CONFORMING';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewDecision = 'APPROVED' | 'REJECTED';

/**
 * Covers both InspectionSummaryResponse (from GET /inspections list) and
 * InspectionDetailResponse (from GET /inspections/{id} and every action endpoint).
 * The detail-only fields (instructions, createdBy, items, ...) are optional because
 * the summary shape returned by the list endpoint omits them.
 */
export interface Inspection {
  id: string;
  templateVersionId?: string;
  templateId?: string;
  templateVersionNumber?: number;
  templateTitle?: string;
  clientId: string;
  clientName?: string;
  siteId: string;
  siteName?: string;
  equipmentId?: string;
  equipmentName?: string;
  technicianId: string;
  technicianName?: string;
  supervisorId: string;
  supervisorName?: string;
  createdBy?: string;
  title: string;
  instructions?: string;
  priority: InspectionPriority;
  status: InspectionStatus;
  scheduledFor: string;
  startedAtServer?: string;
  submittedAtServer?: string;
  approvedAt?: string;
  canceledAt?: string;
  canceledBy?: string;
  canceledReason?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  /** Only present on InspectionDetailResponse (get/create/assign/cancel/start/submit/review actions). */
  items?: InspectionItemSnapshot[];
}

export interface InspectionCreateRequest {
  templateId: string;
  /** Optional: omit to use the template's currently active-for-new-inspections version. */
  templateVersionNumber?: number;
  clientId: string;
  siteId: string;
  equipmentId?: string;
  technicianId: string;
  supervisorId: string;
  title: string;
  instructions?: string;
  priority: InspectionPriority;
  scheduledFor: string;
}

export interface InspectionItemSnapshot {
  id: string;
  sectionTitle: string;
  sectionDescription?: string;
  sectionOrder: number;
  itemCode?: string;
  itemTitle: string;
  itemDescription?: string;
  responseType: string;
  required: boolean;
  rulesJson?: string;
  /** JSON-encoded array of option strings, e.g. '["A","B"]'. */
  optionsJson?: string;
  itemOrder: number;
  answer?: InspectionAnswer | null;
}

export interface InspectionAnswer {
  id: string;
  inspectionItemId: string;
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueDate?: string;
  valueJson?: string;
  observation?: string;
  conformity?: Conformity;
  answeredBy?: string;
  serverReceivedAt?: string;
  version: number;
}

export interface Evidence {
  id: string;
  inspectionId: string;
  responseId?: string;
  nonConformityId?: string;
  type: string;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  checksum?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  uploadedAt: string;
  createdBy?: string;
}

export interface NonConformity {
  id: string;
  inspectionId: string;
  inspectionItemId?: string;
  responseId?: string;
  title: string;
  description?: string;
  severity: Severity;
  status: string;
  createdBy: string;
  createdAt: string;
  version: number;
  /** Not returned by the backend; populated client-side when aggregating across inspections. */
  inspectionTitle?: string;
}

export interface InspectionReview {
  id: string;
  inspectionId: string;
  reviewerId: string;
  reviewerName?: string;
  decision: ReviewDecision;
  reason?: string;
  comments?: string;
  reviewedAt: string;
  reviewCycle: number;
}

export interface ApproveRequest {
  comments?: string;
}

export interface RejectRequest {
  reason: string;
  comments?: string;
}

export interface AuditEvent {
  id: string;
  inspectionId?: string;
  actorId?: string;
  actorName?: string;
  action: string;
  entityType: string;
  entityId: string;
  occurredAt: string;
  requestId?: string;
}
