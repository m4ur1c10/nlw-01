import React, { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { Link, useHistory } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Map, Marker, Popup, TileLayer } from 'react-leaflet';
import api from '../../services/api';
import Item from '../../models/Item';

import './CreatePoint.css';

import logo from '../../assets/logo.svg';
import axios from 'axios';
import { LeafletMouseEvent } from 'leaflet';

interface UF {
    uf: string;
    name: string;
}

interface City {
    name: string;
}

interface IBGEUFRESP {
    sigla: string;
    nome: string;
}

interface IBGECityRESP {
    nome: string;
}

const CreatePoint = () => {

    const [items, setItems] = useState<Item[]>([]);
    const [ufs, setUfs] = useState<UF[]>([]);
    const [cities, setCities] = useState<City[]>([]);

    const [selectedUf, setSelectedUf] = useState('0');
    const [selectedCity, setSelectedCity] = useState('0');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);
    const [selectedPosition, setSelectedPosition] = useState<[number, number]>([0,0]);
    const [initialPosition, setInitialPosition] = useState<[number, number]>([0,0]);

    const history = useHistory();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        whatsapp: ''
    })

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(position => {
            const { latitude, longitude } = position.coords;
            setInitialPosition([latitude, longitude]);
        })
    }, []);

    useEffect(() => {
        api.get('items').then(resp => {
            setItems(resp.data);
        });
    }, []);

    useEffect(() => {
        axios.get<IBGEUFRESP[]>('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome').then(resp => {
            setUfs(resp.data.map(ibgeUf => ({ uf: ibgeUf.sigla, name: ibgeUf.nome }) ));
        });
    }, []);

    useEffect(() => {
        axios.get<IBGECityRESP[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios`).then(resp => {
            setCities(resp.data.map(ibgeCity => ({ name: ibgeCity.nome })));
        });
    }, [selectedUf]);

    function handleSelectUf(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedUf(event.target.value);
    }

    function handleSelectCity(event: ChangeEvent<HTMLSelectElement>) {
        setSelectedCity(event.target.value);
    }

    function handleMapClick(event: LeafletMouseEvent) {        
        setSelectedPosition([event.latlng.lat, event.latlng.lng]);
    }

    function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
        setFormData({ ...formData, [event.target.name]: event.target.value})
    }

    function handleSelectItem(id: number) {
        const alreadySelected = selectedItems.findIndex(item => item === id);
        if (alreadySelected >= 0) {
            const filteredItems = selectedItems.filter(item => item !== id);
            setSelectedItems(filteredItems);
        } else {
            setSelectedItems([ ...selectedItems, id ]);
        }
    }

    async function handleSubmit(event: FormEvent) {
        event.preventDefault();
        const { name, email, whatsapp } = formData;
        const uf = selectedUf;
        const city = selectedCity;
        const [latitude, longitude] = selectedPosition;
        const items = selectedItems;

        const data = {
            name,
            email,
            whatsapp,
            city,
            uf,
            latitude,
            longitude,
            items
        };

        const resp = await api.post('points', data);
        if (resp.status === 200)
            alert('Ponto de coleta criado.');
        else
            alert('Nao foi possivel criar o ponto de coleta.');

        history.push('/');
    }

    return (
        <div id="page-create-point">
            <header>
                <img src={ logo } alt="Ecoleta"/>
                <Link to="/">
                    <FiArrowLeft />
                    Voltar para home
                </Link>
            </header>

            <form onSubmit={handleSubmit}>
                <h1>Cadastro do <br /> ponto de Coleta</h1>

                <fieldset>
                    <legend>
                        <h2>Dados</h2>
                    </legend>
                    <div className="field">
                        <label htmlFor="name">
                            Nome da entidade
                        </label>
                        <input type="text" name="name" id="name" onChange={handleInputChange} />
                    </div>

                    <div className="field-group">                        
                        <div className="field">
                            <label htmlFor="email">
                                E-mail
                            </label>
                            <input type="email" name="email" id="email" onChange={handleInputChange} />
                        </div>                        
                        <div className="field">
                            <label htmlFor="whatsapp">
                                Whatsapp
                            </label>
                            <input type="text" name="whatsapp" id="whatsapp" onChange={handleInputChange} />
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Endereço</h2>
                        <span>Selecione o endereço do mapa</span>
                    </legend>

                    <Map center={initialPosition} zoom={15} onClick={handleMapClick}>
                    <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={selectedPosition}>
                            <Popup>
                                A pretty CSS3 popup. <br /> Easily customizable.
                            </Popup>
                        </Marker>
                    </Map>

                    <div className="field-group">
                        <div className="field">
                            <label htmlFor="uf">Estado (UF)</label>
                            <select onChange={handleSelectUf} value={selectedUf} name="uf" id="uf">
                                <option value="0">Selecione uma UF</option>
                                {ufs.map(uf => (
                                    <option key={uf.uf} value={uf.uf}>{uf.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="field">
                            <label htmlFor="city">Cidade (UF)</label>
                            <select onChange={handleSelectCity} name="city" id="city">
                                <option value="0">Selecione uma cidade</option>
                                {cities.map(city => (
                                    <option key={city.name} value={city.name}>{city.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </fieldset>

                <fieldset>
                    <legend>
                        <h2>Ítens de Coleta</h2>
                        <span>Selecione um ou mais ítens abaixo</span>
                    </legend>
                    <ul className="items-grid">
                        {items.map(item => (
                            <li className={selectedItems.includes(item.id) ? 'selected': ''} key={item.id} onClick={() => handleSelectItem(item.id)}>
                                <img src={item.image_url} alt={item.title} />
                                <span>{item.title}</span>
                            </li>
                        ))}
                    </ul>
                </fieldset>

                <button type="submit">Cadastrar ponto de coleta</button>
            </form>
        </div>
    );
}

export default CreatePoint;