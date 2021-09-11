import axios from "axios";
import {Person} from "../../domain/person";
import {currentUserStore} from "../../app";


export const api = axios.create({
    //baseURL: `http://localhost:3080/`,
    baseURL: ` https://us-central1-person-registry.cloudfunctions.net/api`
});

api.interceptors.request.use( async (config) => {
    const idToken = await currentUserStore.getState().user.getIdToken();
    config.headers = { 'Authorization': 'Bearer ' + idToken };
    return config;
});

export const findByCriteria = async (nameCriteria: string): Promise<Person[]> => {
    const response = await api.get(`/person?nameCriteria=${nameCriteria}`);
    const list:Person[] = [];
    const responseList: any[] = response.data;
    responseList.map(p => {
        return list.push(Object.assign(new Person(), p))
    })
    return list;
}

export const findOne = async (id: string): Promise<Person> => {
    const response = await api.get(`/person/${id}`);
    return Object.assign(new Person(), response.data);
}

export const save = async (person: Person): Promise<Person> => {
    const response = await api.post(`/person`, person);
    return Object.assign(new Person(), response.data);
}