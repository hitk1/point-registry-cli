import 'dotenv/config'
import './database'

import { Command } from 'commander'
import { WorkEntriesService } from './work-entries'
import { WorkLogsService } from './work-log'
import inquirer from 'inquirer'

const system = new Command()
const workEntryService = new WorkEntriesService()
const workLogService = new WorkLogsService()


system
    .command('registry [hour]')
    .description('Creates an entry on today report')
    .action(async (hour) => {
        await workEntryService.create(hour)
    })

system
    .command('list')
    .description('List today records')
    .action(async () => {
        await workEntryService.list()
    })

system
    .command('delete <id>')
    .description('Delete an entry record by its ID')
    .action(async id => {
        await workEntryService.deleteById(id)
    })

system
    .command('worklog')
    .description('Uses AI to enhance feature extraction for a worklog')
    .action(async () => {
        const { prompt } = await inquirer.prompt([
            {
                type: "input",
                name: "prompt",
                message: "Insert the description of your daily activity"
            }
        ])

        await workLogService.createWorkLog(prompt)
    })

system.parse(process.argv)