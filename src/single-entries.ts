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

        console.log(chalk.green('Single entry has been created:'))
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
        const [
            pending,
            existingWorklog
        ] = await Promise.all([
            database.singleEntries.findFirst({
                where: {
                    end_time: null
                }
            }),
            database.workLogs.findFirst({
                where: {
                    project: projectName
                }
            })
        ])

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
        let worklog = existingWorklog

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

            if (!worklog)
                worklog = await transaction.workLogs.create({
                    data: {
                        project: projectName,
                        created_at: new Date(),
                    }
                })

            await transaction.workLogsEntries.create({
                data: {
                    worklog_id: worklog!.id,
                    time_spent_description: timeSpentDescription,
                    time_spent_seconds: timeSpentSeconds,
                    description: `${timeSpentInterval} - ${description} - ${timeSpentDescription}`,
                    created_at: new Date()
                }
            })
        })

        console.log(chalk.green('Worklog has been created'))
    }
}