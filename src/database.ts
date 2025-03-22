import { database } from "./repository"

(async () => {
    await database.$connect()
})()

process.on('beforeExit', async () => {
    await database.$disconnect()
})