export namespace Config {
    export let SERVER_HOST: string = '';
    export let SERVER_INTERNAL_PORT: number = 3000;
    export let SERVER_EXTERNAL_PORT: number = 3000;
 
    export const ONEDAY_MILISECONDS: number = 86400000;  // 24 * 60 * 60 * 1000        
    export const TWOHOURS_MILISECONDS: number = 7200000;  // 2 * 60 * 60 * 1000    
}
