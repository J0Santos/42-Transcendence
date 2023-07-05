import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Res } from '@nestjs/common';
import { UserToChannelService } from './user_to_channel.service';
import { get } from 'http';
import { CreateUserToChannDto } from './dtos/user_to_channel.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { getUserIDFromToken } from 'src/db_interactions_modules/users/getUserIDFromToken';
import { User } from 'src/db_interactions_modules/users/user.entity';
import { UsersService } from 'src/db_interactions_modules/users/users.service';
import { ChannelsService } from 'src/db_interactions_modules/channels/channels.service';


@UseGuards(JwtAuthGuard)
@Controller('usertochannel')
export class UserToChannelController {
  constructor(
      private readonly userToChannelService: UserToChannelService,
      private channelService: ChannelsService,
      private userService: UsersService,
    ) {}
  
 @Post('/joinchannel')
  async create(@Body() channelID: any, @getUserIDFromToken() user:User, @Res() res: any) {
    console.log(channelID.id);
    const channel = await this.channelService.getChannelByID(channelID.id)
    if (!channel){
      return res.status(202).json({ message: 'Channel Doesnt exist' });
    }
    const user_ = await this.userService.findByLogin(user['login'])
    this.userToChannelService.joinchannel(channel, user);
    return res.status(200).json({message : 'Joined Channel'}) 
  }
    
  @Delete('/leavechannel/:id_us/:id_ch')
    remove(@Param('id_us') id_us: number,@Param('id_ch') id_ch: number ) {
      return this.userToChannelService.leavechannel(id_us,id_ch);
    }

  @Get('/getusersonchannel/:id')
  findAll(@Param('id') ch_id: number) {
    return this.userToChannelService.usersonchannel(ch_id);
  }

  @Get('/getChannelsByUserID/:id')
  findChannelsByUserID(@Param('id') us_id: number){
    return this.userToChannelService.findChannelsByID(us_id);
  }

  // @Get('/:id')
  // findOne(@Param('id') id: string) {
  //   return this.friendService.findByUserId(+id);
  // }
  

}
