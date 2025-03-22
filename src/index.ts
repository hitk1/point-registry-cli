import 'dotenv/config'
import './database'

import { Command } from 'commander'
import { WorkEntriesService } from './service'

const system = new Command()
const workEntryService = new WorkEntriesService()


system
    .command('registry <hour>')
    .description('Creates an entry on today report')
    .action(async (hour) => {
        await workEntryService.create(hour)
    })

system
    .command('list')
    .description('List today records')
    .action(async () => {
        const result = await workEntryService.list()
        console.table(result)
    })

system.parse(process.argv)