import 'dotenv/config'
import './database'

import { Command } from 'commander'
import inquirer from 'inquirer'

import { WorkEntriesService } from './work-entries'
import { WorkLogsService } from './work-log'
import { SingleEntries } from './single-entries'
import chalk from 'chalk'
import { capitalizeFirstLetter } from './utils'

const system = new Command()
const workLogSystem = new Command('worklog').description('Module for create worklog records')

const workEntryService = new WorkEntriesService()
const workLogService = new WorkLogsService()
const singleEntryService = new SingleEntries()

system
    .command('registry [hour]')
    .description('Creates an entry on today report.')
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
    .description('Delete an entry record by its ID.')
    .action(async id => {
        await workEntryService.deleteById(id)
    })

workLogSystem
    .command('assistant')
    .description('Uses AI to enhance feature extraction for a worklog.')
    .action(async () => {
        console.log('\n')
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
    .description('List Worklog data (Params: [today], [yest], [dd/MM/yyyy].')
    .action(async (dateParams: any) => {
        await workLogService.listWorkLog(dateParams)
    })

workLogSystem
    .command('start [hour]')
    .description('Command to manual registry an entry about a specific task.\n')
    .action(async (hour) => {
        await singleEntryService.createSingleEntry(hour)
    })

workLogSystem
    .command('pendings')
    .description('List all pendings single entries.')
    .action(async () => {
        await singleEntryService.listPendings()
    })

workLogSystem
    .command('done')
    .description('Finishes the current single entry task.')
    .action(async () => {
        const { project_name } = await inquirer.prompt([
            {
                type: 'input',
                name: 'project_name',
                message: 'Insert the project name.'
            }
        ])

        if (project_name.trim() === '') {
            console.log(chalk.yellow('Project name must not be empty value.'))
            return
        }

        const { hour_param } = await inquirer.prompt([
            {
                type: 'input',
                name: 'hour_param',
                message: 'Insert the hour, if not provided, I will consider NOW.'
            }
        ])

        const { task_description } = await inquirer.prompt([
            {
                type: 'input',
                name: 'task_description',
                message: 'Insert the description about what ou did int the task.'
            }
        ])

        const now = new Date()
        if (hour_param && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hour_param)) {
            const [hour, minutes] = hour_param.split(':')

            now.setHours(Number(hour))
            now.setMinutes(Number(minutes))
        }

        await singleEntryService.finishEntry(capitalizeFirstLetter(project_name), now, capitalizeFirstLetter(task_description))
    })

system.addCommand(workLogSystem)
system.parse(process.argv)