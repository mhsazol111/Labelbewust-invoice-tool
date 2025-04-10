export interface Item {
  id: number;
  description: string;
  quantity: number;
  price: number;
}

export interface Section {
  id: string;
  title: string;
  items: Item[];
  vatRate: number;
}

export interface ProjectDetails {
  projectAddress: string;
  clientName: string;
  email: string;
  phone: string;
  date: string;
  invoiceNumber: string;
  projectDescription: string;
  validity: string;
}