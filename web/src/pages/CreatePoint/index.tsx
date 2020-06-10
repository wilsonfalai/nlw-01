/**
 * Guia TypeScript React
 * https://github.com/typescript-cheatsheets/react-typescript-cheatsheet
 * 
 * Hooks
 *  - useState
 *      const [state, setStateFunction] = useState(initialState);
 *      setStateFunction(newState);
 * 
 *  - useEffect
 *      useEffect(didUpdate);
 */
import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, TileLayer, Marker } from 'react-leaflet';
import api from '../../services/api';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';
import Dropzone from '../../components/Dropzone';

import './styles.css';
import logo from '../../assets/logo.svg';


//DEFINIÇÃO DE INTERFACES
interface Item {
    id: number,
    title: string,
    image_url: string
}

interface IBGEUFResponse {
    sigla: string
}

interface IBGECityResponse {
    nome: string
}


const CreatePoint = () => {


    /**
     * ESTADOS
     * Quando armazenar um array ou objeto no estado informar o tipo da variavel que vai ser armazenada
     * useState<Item[]>([]) = Um array do tipo Item
     * useState<string[]>([]) = Um array de string
     */

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<string[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0, 0])
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0, 0])
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedFile, setSelectedFile] = useState<File>();
    const [formData, setFormData] = useState({
        'name': '',
        'email': '',
        'whatsapp': ''
    });

    const history = useHistory();

    /**
     * Hook useEffect
     * Por padrão, useEffects são executados após cada renderização concluída
     * 1 parâmetro uma função que será executada
     * 2 parâmetro - Quando deve ser re-executado. Ex: sempre um estado alterar
     * Rocketseat recomenda cada chamada em um useEfferct separado
     */

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            console.log(position);
            const { latitude, longitude } = position.coords;

            setInitialPosition([latitude, longitude]);
        })
    }, []);

    //Busca os itens de coleta na API e salva no estado items
    useEffect(() => {
        api.get('items').then(response => {
            setItems(response.data);
        })
    }, [])

    //Busca os UFs na API no IBGE e no estado ufs
    useEffect(() => {
        axios.get<IBGEUFResponse[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados').then(response => {
            const ufInitials = response.data.map(uf => uf.sigla)
            setUfs(ufInitials);
        })
    }, []);

    //Busca cidades de um UF via API IBGE sempre que o estado selectedUf for alterado
    //nesse caso após o cliente selecionar o uf pelo select
    useEffect(() => {
        console.log('useEffect /Carregar as cidades api IBGE')
        if (selectedUf === '0') {
            return;
        }
        axios.get<IBGECityResponse[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(response => {
            const cityNames = response.data.map(city => city.nome)
            setCities(cityNames);
        })
    }, [selectedUf]);//quando executar


    /**
     * Eventos
     * As funções abaixo são chamadas pelos select uf e cidade sempre que o usuário selecionar um valor
     */

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
        const uf = event.target.value;
        setSelectedUf(uf);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        const city = event.target.value;
        setSelectedCity(city);
    }

    function handleMapClick(event: LeafletMouseEvent) {
        console.log(event.latlng);
        setSelectedPosition([event.latlng.lat, event.latlng.lng]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        /**
         * Explicando
         * 
         * 1) clona o formData para nunca perder os dados anteriores dos outros campos do estado
         * 2) substitui o valor do input que esta referenciando
         * 
         * Ex: 'whatsapp:value  ou email:value ou [name]:value'
         */
        const { name, value } = event.target;
        setFormData({ ...formData, [name]: value })//nome da propriedade dinâmica
    }

    function handleSelectItem(id: number) {
        //verifica se item clicado já está no array selectedItems
        //findIndex verifica se item já está no array, se estiver retorna -1
        const alredySelected = selectedItems.findIndex(item => item === id);
        if (alredySelected >= 0) {
            //filtrando e pegando apenas o que for diferente de ID
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([...selectedItems, id]);
        }


    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();

        console.log(selectedFile);

        //return;//para ver o log e não executar o restante

        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = new FormData();


        data.append('name',name);
        data.append('email', email);
        data.append('whatsapp',whatsapp);
        data.append('uf',uf);
        data.append('city',city);
        data.append('latitude',String(latitude));
        data.append('longitude',String(longitude));
        data.append('items',items.join(','));
        if(selectedFile){
            data.append('image',selectedFile);
        }
        


        await api.post('points', data);

        alert('Ponto de coleta criado');

        history.push('/');//redir
    }

    //RETURN/CONTEÚDO HTML
    return (
        <>
            <div hidden className="alert">
                <div className="alert-content">
                    <FiArrowLeft /> <br />
                    <strong>Voltar para home</strong>
                </div>
            </div>

            <div id="page-create-point">
                <header>
                    <img src={logo} alt="Ecoleta" />
                    <Link to="/">
                        <FiArrowLeft />
                    Voltar para home
                </Link>
                </header>

                <form onSubmit={handleSubmit}>
                    <h1>Cadastrp do <br /> ponto de coleta</h1>


                    <Dropzone onFileUploaded={setSelectedFile} />

                    <fieldset>
                        <legend>
                            <h2>Dados</h2>
                        </legend>

                        <div className="field">
                            <label htmlFor="name">Nome da entidade</label>
                            <input type="text" name="name" id="name" onChange={handleInputChange} />
                        </div>

                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="name">E-mail</label>
                                <input type="email" name="email" id="email" onChange={handleInputChange} />
                            </div>

                            <div className="field">
                                <label htmlFor="name">Whatsapp</label>
                                <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>
                            <h2>Endereço</h2>
                            <span>Selecione o endereço no mapa</span>
                        </legend>

                        <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                            <TileLayer
                                attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            <Marker position={selectedPosition}>
                                {/* <Popup>
                                A pretty CSS3 popup. <br /> Easily customizable.
                            </Popup> */}
                            </Marker>
                        </Map>

                        <div className="field-group">
                            <div className="field">
                                <label htmlFor="uf">Estado (UF)</label>
                                <select name="uf" id="uf" value={selectedUf} onChange={handleSelectUf}>
                                    <option value="0">Selecione uma UF</option>
                                    {ufs.map(uf => (
                                        <option key={uf} value={uf}>{uf}</option>
                                    ))}

                                </select>
                            </div>
                            <div className="field">
                                <label htmlFor="city">Cidade</label>
                                <select name="city" id="city" value={selectedCity} onChange={handleSelectCity}>
                                    <option value="0">Selecione uma cidade</option>
                                    {cities.map(city => (
                                        <option key={city} value={city}>{city}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </fieldset>

                    <fieldset>
                        <legend>
                            <h2>ítens de coleta</h2>
                            <span>Selecione um ou mais ítens abaixo</span>
                        </legend>
                        <ul className="items-grid">
                            {items.map(item => (
                                <li
                                    key={item.id}
                                    onClick={() => handleSelectItem(item.id)}
                                    className={selectedItems.includes(item.id) ? 'selected' : ''}
                                >
                                    <img src={item.image_url} alt={item.title} />
                                    <span>{item.title}</span>
                                </li>
                            ))}


                        </ul>
                    </fieldset>

                    <button type="submit">
                        Cadastrar ponto de coleta
                </button>

                </form>

            </div>
        </>


    )
}

export default CreatePoint;