export const includeInPatients = {
  createdByUser: {
    select: {
      userId: true,
      email_mobile: true,
      verify: true
    }
  },
  createdByAdmin: {
    select: {
      adminId: true,
      email: true,
      mobile: true
    }
  },
  appointments: true,
  policiesAcknowledgment: true,
  dentalInformation: true,
  insurance: true,
  medicalHistory: true
};

export const includeInAppointments = {
  createdByUser: {
    select: {
      userId: true,
      email_mobile: true,
      verify: true
    }
  },
  createdByAdmin: {
    select: {
      adminId: true,
      email: true,
      mobile: true
    }
  },
  patient: true,
};

export const states = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
];