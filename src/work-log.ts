import OpenAI from "openai"
import ora from 'ora'

export class WorkLogsService {
    private openaiClient: OpenAI
    private templatePrompt: string

    constructor() {
        this.openaiClient = new OpenAI()
        this.templatePrompt = `
            Você é um excelente auxiliar de projeto, com extrema experiência em análise de texto e extração de features.
            Preciso criar alguns registros com base em descrições fornecidas de relatos do dia a dia de um desenvolvedor de software que precisa registrar seus horários de trabalhos nos projetos envolvidos.
            Você precisa seguir os modelos abaixo como linha de base para operar e extrair os dados, segue:

            1 -> "Dia iniciou as 09:00 com analise de documentos do projeto Routing, as 09:30 iniciou a daily com o time que durou 30 minutos,
            logo após segui com desenvolvimento seguindo a lista de tarefas especificada até as 12:00.
            Logo voltando do almoço, continue com a analise das tarefas e implementação das definições solicitadas, as 14:30 um colega me chamou para uma call de alinhamento que durou mais 40 minutos
            e logo em sequência fiquei focado nas tarefas até o final do dia as 18:00"
            Extração de dados:
             - Nome do projeto: Routing;
             - Horas de trabalho:
             -- 09:00 às 09:30 = Analise de documentos - (30m)
             -- 10:00 às 12:00 = Codificação seguindo lista de tarefas - (2h)
             -- 13:00 às 14:30 = Codificação seguindo lista de tarefas - (1h 30m)
             -- 14:30 às 15:10 = Reunião de alinhamento com colega de trabalho - (40m)
             -- 15:10 às 18:00 = Codificação seguindo lista de tarefas - (2h 50m)
            
            2 -> "Dia iniciou as 09:00, seguindo tarefas especificadas do TRem2, as 11:00 iniciou a daily e terminou na hora do almoço,
            Logo voltando do almoço, continue com a analise das tarefas e implementação das definições solicitadas, as 15:00 inicou uma call de alinhamento de expectativas do quarter para entregas que durou mais 1 hora
            e logo em sequência fiquei focado nas tarefas até o final do dia"
            Extração de dados:
             - Nome do projeto: TRem2;
             - Horas de trabalho:
             -- 09:00 às 11:00 = Codificação seguindo lista de tarefas - (2h)
             -- 11:00 às 12:00 = Codificação seguindo lista de tarefas - (1h)
             -- 13:00 às 15:00 = Codificação seguindo lista de tarefas - (2h)
             -- 15:00 às 16:00 = Reunião de alinhamento de expectativas de entregas pro quarter - (1h)
             -- 16:00 às 18:00 = Codificação seguindo lista de tarefas - (2h)
             `
    }

    async createWorkLog(text: string) {
        const spinner = ora('Extracting features').start()

        const response = await this.openaiClient.chat.completions.create({
            messages: [{ role: 'user', content: this.buildPrompt(text) }],
            model: 'gpt-4o-mini'
        })

        // spinner.text = 'Summarizing data'
        // spinner.color = 'green'

        spinner.stop()
        console.log(response.choices[0].message.content)
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