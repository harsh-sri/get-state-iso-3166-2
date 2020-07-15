interface IProcessRowResponse {
    zip: string,
    country: string,
    data: {
        state: string,
        raw: string
    }
}

export default IProcessRowResponse;
