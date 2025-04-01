import { format } from 'date-fns'
import chalk from 'chalk'

import { database } from './repository'
import { DateService } from './utils'

const eWorkEntris = {
    IN: 'in',
    OUT: 'out'
} as const



export class WorkEntriesService {
    private dateService: DateService
    private listRecordsAvailableParams: string[]

    constructor() {
        this.dateService = new DateService()
        this.listRecordsAvailableParams = ['today', 'yest', 'week', 'month', 'last_month']
    }

    async create(params?: string) {
        try {
            let now = this.dateService.formatDate(new Date())

            if (params && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(params)) {
                const [hour, minutes] = params.split(':')

                now.setHours(Number(hour))
                now.setMinutes(Number(minutes))
            }
            const lastRecord = await database.workEntries.findFirst({
                orderBy: {
                    entry_date: 'desc'
                },
                take: 1
            })

            const newEntryType = lastRecord ?
                lastRecord.type === eWorkEntris.IN
                    ? eWorkEntris.OUT : eWorkEntris.IN
                : eWorkEntris.IN

            await database.workEntries.create({
                data: {
                    entry_date: now,
                    type: newEntryType
                }
            })
            console.log('New entry has been created')
        } catch (error) {
            console.log('Error on create a new entry', { message: error.message })
        }
    }

    async list(dateParams?: string) {
        let beginDate = new Date()
        let endDate = new Date()
        beginDate.setHours(0, 0, 0, 0)
        endDate.setHours(23, 59, 59, 999)

        switch (dateParams?.toLowerCase()) {
            case null:
                break
            case 'today':
                break
            case 'yest':
                beginDate = this.dateService.addDate(beginDate, { days: -1 })
                endDate = this.dateService.addDate(endDate, { days: -1 })
                break
            case 'week':
                const dayOfWeek = beginDate.getDay()

                beginDate = this.dateService.addDate(beginDate, { days: dayOfWeek > 0 ? -dayOfWeek : 0 })
                endDate = this.dateService.addDate(endDate, { days: dayOfWeek > 0 ? 6 - dayOfWeek : 6 })
                break
            case 'month':
                beginDate = new Date(
                    beginDate.getFullYear(),
                    beginDate.getMonth(),
                    1,
                    0,
                    0,
                    0,
                    0
                )
                break
            case 'last_month':
                beginDate = new Date(
                    beginDate.getFullYear(),
                    beginDate.getMonth() - 1,
                    1,
                    0,
                    0,
                    0,
                    0
                )

                this.dateService.addDate(endDate, { months: -1 })
                break
        }

        const result = await database.workEntries.findMany({
            where: {
                entry_date: {
                    gte: beginDate,
                    lte: endDate
                }
            },
            orderBy: {
                entry_date: 'asc'
            }
        })

        console.table(result.map(item => ({
            id: item.id,
            time: format(item.entry_date, 'dd/MM/yyyy - HH:mm'),
            type: item.type === eWorkEntris.IN ? 'Entrada' : 'Saida'
        })))
    }

    async deleteById(id?: string) {
        if (!id) {
            console.log(chalk.yellow('ID is a required argument'))
            return
        }

        await database.workEntries.delete({
            where: {
                id: Number(id)
            }
        })

        console.log(chalk.green('Entry has been deleted'))
    }
}