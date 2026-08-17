import { EntityStatus } from './common.model';

export interface Client {
  id: string;
  name: string;
  legalName?: string;
  document?: string;
  email?: string;
  phone?: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ClientRequest {
  name: string;
  legalName?: string;
  document?: string;
  email?: string;
  phone?: string;
  version?: number;
}

export interface InspectionSite {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SiteRequest {
  clientId: string;
  name: string;
  description?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactName?: string;
  contactPhone?: string;
  version?: number;
}

export type EquipmentStatus = 'ACTIVE' | 'INACTIVE' | 'DECOMMISSIONED';

export interface Equipment {
  id: string;
  siteId: string;
  name: string;
  assetNumber?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  qrCode: string;
  status: EquipmentStatus;
  installedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface EquipmentRequest {
  siteId: string;
  name: string;
  assetNumber?: string;
  serialNumber?: string;
  manufacturer?: string;
  model?: string;
  description?: string;
  qrCode: string;
  installedAt?: string;
  version?: number;
}
