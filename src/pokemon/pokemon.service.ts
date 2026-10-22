import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';
import { PaginationDto } from '../common/dto/pagination.dto';

interface MongoDuplicateKeyError {
  code: 11000;
  keyValue: Record<string, unknown>;
}

function isMongoDuplicateKeyError( error: unknown ): error is MongoDuplicateKeyError {
  return typeof error === 'object' && error !== null && ( error as { code?: number } ).code === 11000;
}

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel( Pokemon.name )
    private readonly pokemonModel: Model<Pokemon>
  ){}

  async create(createPokemonDto: CreatePokemonDto) {
    createPokemonDto.name = createPokemonDto.name.toLowerCase()
    try{

      const pokemon = await this.pokemonModel.create( createPokemonDto )
      return pokemon;
    }catch (error){
      this.handleExceptions(error)
    }
  }

  findAll( paginationDto: PaginationDto) {
    const { limit = 10, offset = 0 } = paginationDto;
    return this.pokemonModel.find()
    .limit( limit )
    .skip( offset )
  }

  async findOne(term: string) {
    let pokemon: Pokemon | null = null;
    
    if( !isNaN(+term )){
      pokemon = await this.pokemonModel.findOne({ no: +term })
    }

    if( !pokemon && isValidObjectId( term ) ){
      pokemon = await this.pokemonModel.findById( term )
    }

    if( !pokemon ){
      pokemon = await this.pokemonModel.findOne({ name: term.toLowerCase().trim() })
    }


    if( !pokemon ) throw new NotFoundException(`Pokemon with id, name or no '${ term }' not found`)

    return pokemon
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {

    let pokemon = await this.findOne( term )

    if( updatePokemonDto.name )
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase()


    try {
      await pokemon.updateOne( updatePokemonDto )
      return {
        ...pokemon.toJSON(), ...updatePokemonDto
      };
      
    } catch (error) {
      this.handleExceptions(error)
    }

    

  }

  async remove(id: string) {
    // const pokemon = await this.findOne(id)
    // await pokemon.deleteOne()

    // const result = await this.pokemonModel.findByIdAndDelete( id )

    const { deletedCount } = await this.pokemonModel.deleteOne({ _id: id })

    if( deletedCount === 0 )
      throw new BadRequestException(`Pokemon with id "${ id }" not found`)


    return;
  }

  private handleExceptions( error: any ){
    if( isMongoDuplicateKeyError(error) ){
        throw new BadRequestException(`Pokemon exist in db ${ JSON.stringify( error.keyValue) }`)
      }
      console.log( error )
      throw new InternalServerErrorException(`Can´t create pokemon - Chekc server logs`)
  }
}
