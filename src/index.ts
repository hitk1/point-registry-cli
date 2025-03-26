import 'dotenv/config'
import './database'

import { Command } from 'commander'
import inquirer from 'inquirer'

import { WorkEntriesService } from './work-entries'
import { WorkLogsService } from './work-log'

const system = new Command()
const workLogSystem = new Command('worklog').description('Module for create worklog records')

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

workLogSystem
    .command('create')
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

workLogSystem
    .command('list [dateParam]')
    .description('List Worklog data (Params: [today], [yest], [dd/MM/yyyy]')
    .action(async (dateParams: any) => {
        await workLogService.listWorkLog(dateParams)
    })

system.addCommand(workLogSystem)

system.parse(process.argv)