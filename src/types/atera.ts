// Atera API response wrapper for paginated endpoints
export interface AteraPaginatedResponse<T> {
  items: T[];
  totalItems: number;
  page: number;
  itemsInPage: number;
  totalPages: number;
}

// GET /api/v3/myaccount
export interface AteraAccount {
  AccountId: number;
  AccountName: string;
  PlanName: string;
  NumberOfAgents: number;
  NumberOfExperts: number;
  NumberOfDevicesInAccount: number;
  MaximumNumberOfAgentsInAccount: number;
}

// GET /api/v3/customers
export interface AteraCustomer {
  CustomerID: number;
  CustomerName: string;
  BusinessNumber: string;
  Domain: string;
  Address: string;
  City: string;
  State: string;
  Country: string;
  Phone: string;
  Fax: string;
  Notes: string;
  Links: string;
  Longitude: number;
  Latitude: number;
  ZipCodeStr: string;
  CreatedOn: string;
  LastModified: string;
  RankId: number;
}

// GET /api/v3/contracts
export interface AteraContract {
  ContractID: number;
  ContractName: string;
  CustomerID: number;
  CustomerName: string;
  ContractType: string;
  Active: boolean;
  StartDate: string;
  EndDate: string;
  BillingPeriod: string;
  Currency: string;
  ContractValue: number;
  Description: string;
  TaxRate: number;
}

// GET /api/v3/tickets
export interface AteraTicket {
  TicketID: number;
  TicketTitle: string;
  TicketNumber: string;
  TicketPriority: string;
  TicketStatus: string;
  TicketType: string;
  TicketSource: string;
  CustomerID: number;
  CustomerName: string;
  ContactID: number;
  EndUserFirstName: string;
  EndUserLastName: string;
  EndUserEmail: string;
  TechnicianContactID: number;
  TechnicianFullName?: string;
  FirstTechnicianFirstName: string;
  FirstTechnicianLastName: string;
  Description: string;
  SLAName: string;
  OnSiteDurationMinutes: number;
  OffSiteDurationMinutes: number;
  TotalDurationMinutes: number;
  CreatedDate: string;
  LastModifiedDate: string;
  ClosedDate: string;
  FirstResponseDate: string;
}

// GET /api/v3/tickets/{ticketId}/comments
export interface AteraTicketComment {
  CommentID: number;
  TicketID: number;
  Comment: string;
  IsInternal: boolean;
  CreatedOn: string;
  EndUserFirstName: string;
  EndUserLastName: string;
  TechnicianContactID: number;
}

// GET /api/v3/tickets/{ticketId}/workhours
export interface AteraTicketWorkHours {
  TicketID: number;
  TechnicianFullName: string;
  StartTime: string;
  EndTime: string;
  DurationMinutes: number;
  OnSite: boolean;
  Notes: string;
}

// GET /api/v3/tickets/{ticketId}/billableduration
export interface AteraTicketBillableDuration {
  TicketID: number;
  BillableDurationMinutes: number;
  NonBillableDurationMinutes: number;
  TotalDurationMinutes: number;
}

// Slim ticket shape used by atera_list_tickets_by_technician
export interface AteraTicketSlim {
  TicketID: number;
  TicketTitle: string;
  TicketStatus: string;
  TicketPriority: string;
  CustomerName: string;
  TechnicianFullName: string;
  CreatedDate: string;
}

// GET /api/v3/agents/customer/{customerId}
export interface AteraAgent {
  AgentID: number;
  AgentName: string;
  CustomerID: number;
  CustomerName: string;
  MachineName: string;
  DomainName: string;
  OSType: string;
  OSVersion: string;
  Online: boolean;
  LastRebootTime: string;
  LastPatchTime: string;
  IpAddresses: string;
}

// GET /api/v3/contacts/customer/{customerId}
export interface AteraContact {
  EndUserID: number;
  Firstname: string;
  Lastname: string;
  Email: string;
  Phone: string;
  JobTitle: string;
  CustomerID: number;
  CustomerName: string;
  CreatedOn: string;
  LastModified: string;
}

// Raw paginated response from Atera API
export interface AteraApiPageResponse<T> {
  items: T[];
  totalPages: number;
  page: number;
  prevLink: string;
  nextLink: string;
}
