import fs from 'fs';

export const readFile = async (fileName: string): Promise<any[]> => {
    try {
        const data = fs.readFileSync(`./src/store/${fileName}.json`, 'utf8');
        return JSON.parse(data || "[]") as any[];
    } catch (err) {
        return [];
    }
}

export const writeFile = async (fileName: string, data: any) => {
    try {
        fs.writeFileSync(`./src/store/${fileName}.json`, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error writing file:", err);
    }
}
