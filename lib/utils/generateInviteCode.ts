
export function generateInviteCode() {

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'

  let result = ''

  for (let i = 0; i < 7; i++) {

    if (i === 3) {
      result += '-'
    } else {
      result += chars.charAt(
        Math.floor(Math.random() * chars.length)
      )
    }
  }

  return result
}
