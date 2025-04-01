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

    /**
     * 
     * @param date 
     * It could be a string in this format HH:mm
     * or a date to be formated
     */
    formatDate(date: Date | string): Date {
        let now = new Date()
        now.setSeconds(0)
        now.setMilliseconds(0)

        if (typeof date === 'string') {
            if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(date)) {
                console.log('Date params informed in a invalid format.')
                throw new Error('Date params informed in a invalid format.')
            }
            
            const [hour, minutes] = date.split(':')
            now.setHours(Number(hour))
            now.setMinutes(Number(minutes))
        } else {
            now.setHours(date.getHours())
            now.setMinutes(date.getMinutes())
        }

        return now
    }
}

export const capitalizeFirstLetter = (text: string): string => {
    if (!text) return ""

    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}