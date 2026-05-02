export interface JsonData {
    [key: string]: unknown;
}


export function getNestedValue(obj: unknown, path: string): unknown {
    const keys = path.replace(/\[(\d+)\]/g, '.$1').split('.');
    let result: unknown = obj;

    for (const key of keys) {
        if (result && typeof result === 'object') {
            result = (result as JsonData)[key];
        } else {
            return undefined;
        }
    }

    return result;
}

export function getNestedValueWithColons(obj: unknown, path: string): {[id:string]:unknown} {
    const keys = path.replace(/\[([:\*\d+])\]/g, '.$1').split('.');
    let result: {[id:string]:unknown} = {"":obj};

    for (const key of keys) {
        const isObject = result && !Object.values(result).some(item => typeof item !== 'object')
        if (isObject) {
            let newResult: {[id:string]:unknown}  = {};
            for (const [base, value1] of Object.entries(result)) {
                if (key==='*' || key===':'){
                    for (const [key1, value2] of Object.entries(value1 as JsonData)) {
                        newResult[base+"."+key1] = value2;
                    }
                }else{
                    newResult[base+"."+key] = (value1 as JsonData)[key];
                }
            }
            result = newResult;  
        }
    }
    return result;
}