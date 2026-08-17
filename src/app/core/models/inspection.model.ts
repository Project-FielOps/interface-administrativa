export type InspectionStatus = 'DRAFT' | 'ASSIGNED' | 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELED';
export type InspectionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type Conformity = 'NOT_APPLICABLE' | 'CONFORMING' | 'NON_CONFORMING';
export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ReviewDecision = 'APPROVED' | 'REJECTED';

export interface Inspection {
  id: string;
  templateVersionId: string;
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
  createdBy: string;
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
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface InspectionCreateRequest {
  templateVersionId: string;
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
  inspectionId: string;
  sectionTitle: string;
  sectionOrder: number;
  itemCode?: string;
  itemTitle: string;
  itemDescription?: string;
  responseType: string;
  required: boolean;
  optionsJson?: string[];
  itemOrder: number;
  response?: InspectionResponse;
}

export interface InspectionResponse {
  id: string;
  inspectionId: string;
  inspectionItemId: string;
  valueText?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueDate?: string;
  observation?: string;
  conformity?: Conformity;
  answeredBy?: string;
  answeredAtDevice?: string;
  serverReceivedAt?: string;
  evidence?: Evidence[];
}

export interface Evidence {
  id: string;
  inspectionId: string;
  responseId?: string;
  nonConformityId?: string;
  type: string;
  storageKey: string;
  url?: string;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  description?: string;
  capturedAtDevice?: string;
  uploadedAt: string;
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
  updatedAt: string;
  version: number;
  evidence?: Evidence[];
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
  createdAt: string;
}

export interface ReviewRequest {
  decision: ReviewDecision;
  reason?: string;
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
