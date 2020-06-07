import knex from '../database/connection';
import apiConfig from '../api-config';
import { Request, Response } from 'express';

class ItemsController {

    async index(req: Request, res: Response) {

        const items = await knex('items').select('*');
    
        const serializedItems = items.map(item => {
            return {
                id: item.id,
                name: item.title,
                image_url: `${apiConfig.endpoint_name}/uploads/${item.image}`
            }
        });
    
        return res.json(serializedItems);
    }

}

export default ItemsController;