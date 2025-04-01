import { format } from 'date-fns'
import { database } from './repository'
import { DateService } from './utils'

const eWorkEntris = {
    IN: 'in',
    OUT: 'out'
} as const



export class WorkEntriesService {
    private dateService: DateService

    constructor(){
        this.dateService = new DateService()
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

    async list() {
        const result = await database.workEntries.findMany({})

        console.table(result.map(item => ({
            id: item.id,
            time: format(item.entry_date, 'dd/MM/yyyy - HH:mm'),
            type: item.type === eWorkEntris.IN ? 'Entrada' : 'Saida'
        })))
    }

    async deleteById(id?: string) {
        if (!id) {
            console.log('ID is a required argument')
            return
        }

        await database.workEntries.delete({
            where: {
                id: Number(id)
            }
        })

        console.log('Entry has been deleted')
    }
}