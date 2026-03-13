import React from 'react';

export enum Category {
  D2C = "D2c brand",
  DROPSHIPPER = "Dropshipper",
  WHOLESALER = "Wholesaler / supplier"
}

export enum Niche {
  JEWELLERY = "Jewellery",
  APPAREL = "Apparel",
  COSMETIC = "Cosmetic",
  FASHION = "Fashion and Accessories",
  OTHER = "Other"
}

export enum PipelineStatus {
  NEW = "New Lead",
  CONTACTED = "Contacted",
  NEGOTIATION = "Negotiation",
  WON = "Won",
  LOST = "Lost"
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  altPhone: string;
  category: Category;
  website?: string;
  niche: Niche;
  status: PipelineStatus;
  createdAt: string;
  avatarUrl?: string;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
}