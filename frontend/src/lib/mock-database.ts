// Mock database for development
// In production, this would be replaced with a proper database

export const users: any[] = []
export const emailTokens: { [token: string]: { email: string; address: string; userData: any } } = {}

export function addUser(user: any) {
  users.push(user)
}

export function findUserByAddress(address: string) {
  return users.find(user => user.address.toLowerCase() === address.toLowerCase())
}

export function findUserByEmail(email: string) {
  return users.find(user => user.email.toLowerCase() === email.toLowerCase())
}

export function findUserByUsername(username: string) {
  return users.find(user => user.username.toLowerCase() === username.toLowerCase())
}

export function updateUser(address: string, updates: any) {
  const userIndex = users.findIndex(user => user.address.toLowerCase() === address.toLowerCase())
  if (userIndex !== -1) {
    users[userIndex] = { ...users[userIndex], ...updates }
    return users[userIndex]
  }
  return null
}

export function addEmailToken(token: string, data: any) {
  emailTokens[token] = data
}

export function getEmailToken(token: string) {
  return emailTokens[token]
}

export function removeEmailToken(token: string) {
  delete emailTokens[token]
}