export const contact = {
  siteName: 'Philosophies Of A Cyborg',
  name: 'Ositu Kengere',
  email: 'manyaos.47@gmail.com',
  phone: '' as string,
  youtube:
    'https://www.youtube.com/results?search_query=Ositu%20Kengere%20Philosophies%20Of%20A%20Cyborg',
  reddit: 'https://www.reddit.com/user/Logarn/'
} as const;

export const contactHref = {
  email: `mailto:${contact.email}?subject=Philosophies%20Of%20A%20Cyborg`,
  phone: contact.phone
    ? `tel:${contact.phone.replace(/[^+\d]/g, '')}`
    : `mailto:${contact.email}?subject=Call%20me`,
  youtube: contact.youtube,
  reddit: contact.reddit
} as const;
