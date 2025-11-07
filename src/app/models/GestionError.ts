export interface GestionError<T> {
    information: T;
    message: string;
    status: number;
}