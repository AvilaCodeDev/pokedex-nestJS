import { Injectable } from '@nestjs/common';
import { PokeResponse } from './interfaces/poke-response.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Pokemon } from 'src/pokemon/entities/pokemon.entity';
import { Model } from 'mongoose';
import { AxiosAdapter } from 'src/common/adapters/axios.adapert';

@Injectable()
export class SeedService {

  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>,

    private readonly http: AxiosAdapter,
  ){}



  async registerSeed(name:string, no:number){
    try {
      const pokemon = await this.pokemonModel.create({ name, no });
      console.log( pokemon )
    } catch (error) {
      console.log(error);
    }
  }

  async executeSeed(){

    await this.pokemonModel.deleteMany();

    const data = await this.http.get<PokeResponse>('https://pokeapi.co/api/v2/pokemon?limit=650');

    // const insertPromisesArray: Promise<any>[] = [];

    // data.results.forEach(({ name, url })=>{
    //   const segments = url.split('/');
    //   const no:number = +segments[segments.length - 2]

    //   // await this.registerSeed(name, no);
    //   insertPromisesArray.push(
    //     this.pokemonModel.create({ name, no})
    //   )
    // })

    // await Promise.all( insertPromisesArray )

    const pokemonToInsert: { name:string, no:number } [] = []

    data.results.forEach(({ name, url }) => {
      const segments = url.split('/')
      const no: number = + segments[ segments.length - 2 ]


      pokemonToInsert.push({ name, no })
    })

    await this.pokemonModel.insertMany( pokemonToInsert );


    return 'Seed Executed';
  }
}
