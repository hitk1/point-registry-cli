import chalk from "chalk";
import { differenceInMinutes, format, parse } from 'date-fns'
import { database } from "./repository";

export class SingleEntries {
    async createSingleEntry(params?: string) {
        const now = new Date()

        if (params && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(params)) {
            const [hour, minutes] = params.split(':')

            now.setHours(Number(hour))
            now.setMinutes(Number(minutes))
        }

        const pendings = await database.singleEntries.findFirst({
            where: {
                end_time: null
            }
        })

        if (pendings) {
            console.log(chalk.yellow('There is a pending entry, you must finish it!'))
            return
        }

        const result = await database.singleEntries.create({
            data: {
                start_time: now
            }
        })

        console.log(chalk.green('Single entry has been created:'), chalk.blue(result.id))
    }

    async listPendings() {
        const result = await database.singleEntries.findMany({
            where: {
                end_time: null
            }
        })

        console.table(result)
    }

    async finishEntry(projectName: string, hour: Date, description: string) {
        const pending = await database.singleEntries.findFirst({
            where: {
                end_time: null
            }
        })

        if (!pending) {
            console.log(chalk.yellow('There is no pending entry to be finished'))
            return
        }

        const diffMinutes = differenceInMinutes(hour, pending.start_time)
        const hours = Math.floor(diffMinutes / 60)
        const minutes = diffMinutes % 60

        let timeSpentDescription = ""
        if (hours > 0) timeSpentDescription += `${hours}h`
        if (minutes > 0) timeSpentDescription += ` ${minutes}m`

        const timeSpentInterval = `${format(pending.start_time, "HH:mm")} às ${format(hour, "HH:mm")}`
        const timeSpentSeconds = Math.floor((hour.getTime() - pending.start_time.getTime()) / 1000)

        await database.$transaction(async transaction => {
            await transaction.singleEntries.update({
                where: {
                    id: pending.id
                },
                data: {
                    end_time: hour,
                    project: projectName,
                    description,
                }
            })

            const workLogProject = await transaction.workLogs.findFirst({
                where: {
                    project: projectName
                }
            })
        })
    }
}