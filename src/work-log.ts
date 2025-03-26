import OpenAI from "openai"
import ora from 'ora'
import { database } from "./repository"
import { subDays } from "date-fns"
import { DateService } from "./utils"

interface IRawExtractionFeaturesResult {
    project: string,
    entries: {
        description: string,
        interval_time_spent: string,
        time_spent_description: string,
        time_spent_seconds: number
    }[]
}

export class WorkLogsService {
    private openaiClient: OpenAI
    private templatePrompt: string
    private worklogListAvailableParams: string[]
    private dateService: DateService

    constructor() {
        this.openaiClient = new OpenAI()
        this.templatePrompt = `
            Você é um excelente auxiliar de projeto, com extrema experiência em análise de texto e extração de features.
            Preciso criar alguns registros com base em descrições fornecidas de relatos do dia a dia de um desenvolvedor de software que precisa registrar seus horários de trabalhos nos projetos envolvidos.
            Você precisa seguir os modelos abaixo como linha de base para operar e extrair os dados.
            Sempre considere o início dos dias as 09:00 da manha e o término dos dias às 18:00, seguem os exemplos:

            1 -> "Dia iniciou as 09:00 com analise de documentos do projeto Routing, as 09:30 iniciou a daily com o time que durou 30 minutos,
            logo após segui com desenvolvimento seguindo a lista de tarefas especificada até as 12:00.
            Logo voltando do almoço, continuei com a analise das tarefas e implementação das definições solicitadas, as 14:30 um colega me chamou para uma call de alinhamento que durou mais 40 minutos
            e logo em sequência fiquei focado nas tarefas até o final do dia as 18:00"
            Extração de dados:
             - Nome do projeto: Routing;
             - Horas de trabalho:
             -- 09:00 às 09:30 = Analise de documentos - (30m)
             -- 09:30 às 10:00 = Reunião diária com o time - (30m)
             -- 10:00 às 12:00 = Codificação seguindo lista de tarefas - (2h)
             -- 12:00 às 13:00 = Horário de almoço (1h)
             -- 13:00 às 14:30 = Codificação seguindo lista de tarefas - (1h 30m)
             -- 14:30 às 15:10 = Reunião de alinhamento com colega de trabalho - (40m)
             -- 15:10 às 18:00 = Codificação seguindo lista de tarefas - (2h 50m)
            
            2 -> "Iniciei o dia seguindo tarefas especificadas do TRem2, as 11:00 iniciou a daily e terminou na hora do almoço,
            Logo voltando do almoço, continue com a analise das tarefas e implementação das definições solicitadas, as 15:00 inicou uma call de alinhamento de expectativas do quarter para entregas que durou mais 1 hora
            e logo em sequência fiquei focado nas tarefas até o final do dia"
            Extração de dados:
             - Nome do projeto: TRem2;
             - Horas de trabalho:
             -- 09:00 às 11:00 = Codificação seguindo lista de tarefas - (2h)
             -- 11:00 às 12:00 = Reunião diária com o time - (1h)
             -- 12:00 às 13:00 = Horário de almoço (1h)
             -- 13:00 às 15:00 = Codificação seguindo lista de tarefas - (2h)
             -- 15:00 às 16:00 = Reunião de alinhamento de expectativas de entregas pro quarter - (1h)
             -- 16:00 às 18:00 = Codificação seguindo lista de tarefas - (2h)

            3 -> "Comecei o dia com a análise e repriorização das tarefas do Trynfu até as 09:30 que iniciou a daily com o time com duração de 30m, logo após teve um reunião de refinamento de regra de negócio com o time,
            que durou mais 1 hora, o restante do tempo segui com o desenvolvimento das tarefas até a hora do almoço. Logo após o almoço, voltei pras tarefas novamente até as 16:00 que teve outra reunião de alinhamento
            que durou mais 1 hora e meia. O restante do tempo voltei a focar nas tarefas já definidas."
            Extração de dados:
             - Nome do projeto: Trynfu;
             - Horas de trabalho:
             -- 09:00 às 09:30 = Codificação seguindo lista de tarefas - (30m)
             -- 10:00 às 11:00 = Reunião de refinamento de regra de negócio (1h)
             -- 11:00 às 12:00 = Desenvolvimento das tarefas - (1h)
             -- 12:00 às 13:00 = Horário de almoço (1h)
             -- 13:00 às 16:00 = Continuação das tarefas (3h)
             -- 16:00 às 17:30 = Reunião de alinhamento - (1h 30m)
             -- 17:30 às 18:00 = Voltou com foco nas tarefas definidas (30m)
             `
        this.worklogListAvailableParams = ['today', 'yest']
        this.dateService = new DateService()
    }

    async createWorkLog(text: string) {
        const spinner = ora('Extracting features').start()

        const response = await this.openaiClient.chat.completions.create({
            messages: [{ role: 'user', content: this.buildPrompt(text) }],
            model: 'gpt-4o-mini',
            response_format: { "type": "json_object" }
        })

        spinner.stop()
        const result = JSON.parse(response.choices[0].message.content!) as unknown as IRawExtractionFeaturesResult
        await database.workLogs.create({
            data: {
                project: result.project,
                created_at: new Date(),
                worklog_entries: {
                    create: result.entries.map(item => ({
                        time_spent_description: item.time_spent_description,
                        time_spent_seconds: item.time_spent_seconds,
                        description: `${item.interval_time_spent} - ${item.description} - ${item.time_spent_description}`
                    }))
                }
            }
        })

        console.log('Worklog has been created')
    }

    async listWorkLog(dateParam?: string) {
        let filterParam = null

        if (dateParam &&
            (!this.worklogListAvailableParams.includes(dateParam?.toLowerCase() || '') && !/^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/\d{4}$/.test(dateParam || ''))
        ) {
            console.log('Invalid List Parameter')
            return
        }

        if (!dateParam || dateParam!.toLowerCase() === 'today')
            filterParam = new Date()
        else if (dateParam!.toLowerCase() === 'yest')
            filterParam = subDays(new Date(), 1)
        else {
            const [day, month, year] = dateParam!.split('/')

            filterParam = new Date(
                Number(year),
                Number(month) - 1,
                Number(day)
            )
        }

        const result = await database.workLogs.findMany({
            where: {
                created_at: {
                    gte: this.dateService.setBeginDate(filterParam),
                    lte: this.dateService.setEndDate(filterParam)
                }
            },
            include: {
                worklog_entries: true,
            }
        })

        console.table(result)
    }

    private buildPrompt(text: string) {
        return `
            ${this.templatePrompt}  

            Preciso que você faça o mesmo com o trecho de texto a seguir: "${text}".

            Preciso que voce formate a resposta em JSON da seguinte forma, segue o exemplo:
            [
                {
                    "project": [Nome do projeto],
                    "entries": [
                        {
                            "description": [Descrição da tarefa realizada no periodo],
                            "interval_time_spent": [Intervalo de tempo observado, exemplo: '09:00 às 12:00'],
                            "time_spent_description": [Tempo total gasto nessa entrada, exemplo: '2h'],
                            "time_spent_seconds: [Tempo gasto formatado em segundos, exemplo: 2h = '7200'],
                        }
                    ]
                }
            ]
        `
    }
}