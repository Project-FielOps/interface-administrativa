export type TemplateStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE';
export type ResponseType = 'TEXT_SHORT' | 'TEXT_LONG' | 'NUMBER' | 'BOOLEAN' | 'CONFORMITY' | 'SINGLE_CHOICE' | 'DATE';

export interface InspectionTemplate {
  id: string;
  title: string;
  description?: string;
  category: string;
  status: TemplateStatus;
  currentVersion?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface TemplateRequest {
  title: string;
  description?: string;
  category: string;
  version?: number;
}

export interface TemplateItem {
  id: string;
  sectionId: string;
  code?: string;
  title: string;
  description?: string;
  responseType: ResponseType;
  required: boolean;
  observationRequiredOnFailure: boolean;
  evidenceRequiredOnFailure: boolean;
  optionsJson?: string[];
  displayOrder: number;
}

export interface TemplateItemRequest {
  code?: string;
  title: string;
  description?: string;
  responseType: ResponseType;
  required: boolean;
  observationRequiredOnFailure: boolean;
  evidenceRequiredOnFailure: boolean;
  optionsJson?: string[];
  displayOrder: number;
}

export interface TemplateSection {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  displayOrder: number;
  items: TemplateItem[];
}

export interface TemplateSectionRequest {
  title: string;
  description?: string;
  displayOrder: number;
}

export interface InspectionTemplateVersion {
  id: string;
  templateId: string;
  versionNumber: number;
  titleSnapshot: string;
  descriptionSnapshot?: string;
  publishedBy: string;
  publishedAt: string;
  activeForNewInspections: boolean;
  createdAt: string;
}
