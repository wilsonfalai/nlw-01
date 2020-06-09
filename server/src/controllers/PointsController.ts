import {Request, Response} from 'express';
import knex from '../database/connection';

class PointsController {

    async index(request: Request, response: Response){
        const{city,uf,items} = request.query;

        const parsedItems = String(items).split(',').map(item => Number(item.trim()));

        const points = knex('points')
        .join('point_items','points.id','=','point_items.point_id')
        .whereIn('point_items.item_id',parsedItems)
        //.where('city',String(city))
        //.where('uf',String(uf))
        .distinct()
        .select('points.*')
        //.where('city','like',String(city));

        if(city){
            points.where('city',String(city))
        }

        if(uf){
            points.where('uf',String(uf))
        }


        return response.json(await points);
    }

    async show(request: Request, response: Response){
        const id = request.params.id;
        //const {id} = request.params;//mesmo de cima com desestruturação

        const point = await knex('points').where('id',id).first();

        if(!point){
            return response.status(400).json({message: 'Point not found' });
        }

        /**
         * SELECT * from items
         * JOIN point_items on items.id = point_items.item_id
         * WHERE point_items.point_id = {id}
         */
        const items = await knex('items')
        .join('point_items','items.id','=','point_items.item_id')//table do join , id da tabela items, condição, chave extrangeira da tabela join
        .where('point_items.point_id',id)
        .select('items.title','items.image')//comenta se quiser todos os valores


        return response.json({point,items});

    } 

    async create(request: Request, response: Response){
        const {
            name,//short sintaxe, igual a name: name (nome da variável = nome da propriedade)
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        } = request.body;
    
        const trx = await knex.transaction();

        const point = {
            image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=crop&w=400&q=60',
            name,
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };
    
        const ids = await trx('points').insert(point);
    
        const point_id = ids[0];
    
        const pointItems = items.map((item_id: number) => {
            return {
                item_id,
                point_id //short sintaxe com a const point_id definida acima
            }
        });
    
        await trx('point_items').insert(pointItems);
    
        await trx.commit()
    
        //return response.json({ success:true });
        return response.json({ 
            id: point_id, 
            ...point, //...spread pega todo objeto e retorna dentro de outro
        })
    }
}

export default PointsController;