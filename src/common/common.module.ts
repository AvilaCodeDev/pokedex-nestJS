import { Module } from '@nestjs/common';
import { AxiosAdapter } from './adapters/axios.adapert';

@Module({
    providers: [AxiosAdapter],
    exports: [AxiosAdapter]
})
export class CommonModule {}
