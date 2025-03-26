export class DateService {
    setBeginDate(date: Date = new Date()): Date {
        date.setDate(date.getDate() - 1)
        date.setHours(0)
        date.setMinutes(0)
        date.setSeconds(0)
        date.setMilliseconds(0)

        return date
    }

    setEndDate(date: Date = new Date()): Date {
        date.setHours(23)
        date.setMinutes(59)
        date.setSeconds(59)
        date.setMilliseconds(999)

        return date
    }
}