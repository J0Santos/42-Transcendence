import { Controller,UseGuards, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventCreateDto } from './dtos/events.dto';
import { getUserIDFromToken } from 'src/db_interactions_modules/users/getUserIDFromToken';
import { JwtAuthGuard } from 'src/auth/jwt/jwt-auth.guard';
import { User } from '../users/user.entity';
import check_valid_number from '../app/tools/tools';
import { IsArray, isNumber } from 'class-validator';


@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post('/friendship_request')
  async create_friendship_request(@Body() createEventDto: EventCreateDto, @Res() res: any) {
    const ret = await this.eventsService.create(createEventDto, 1);
		if (ret == "2")
		{
			return res.status(303).json({ message: 'Friendship Request Already Sent' });
		}
    return res.status(200).json({ message: 'Friendship Requested' });
  }

  @Post('/private_game_request')
  async create_private_game_request(@Body() createEventDto: EventCreateDto, @Res() res: any) {
    const ret = await this.eventsService.create(createEventDto, 2);
		if (ret == "2") {
			return res.status(303).json({ message: 'Private Game Request Already Sent' });
		}
    if (ret == "3") {
			return res.status(303).json({ message: 'You are already in a game' });
		}
    if (ret == "4") {
			return res.status(303).json({ message: 'Other player is already in a game' });
		}
    return res.status(200).json({ message: 'Private Game Requested' });
  }

  @Post('/channel_join_request')
  create_channel_join_request(@Body() createEventDto: EventCreateDto) {
    return this.eventsService.create(createEventDto, 0);
  }

  @Post('/event_decision/:event_id/:decision')
  async event_decision(@Param('decision') decision: string, @Param('event_id') event_id: number) {
    if(check_valid_number(event_id) && (decision == 'true' || decision == 'false'))
    return await this.eventsService.closedecision(decision, event_id);
  }

  @Get('/notifications')
  findAll(@getUserIDFromToken() user: User) {
    return this.eventsService.findAll_for_user(user.id);
  }

  @Delete('/clear_notifications')
  clearNotifications(@getUserIDFromToken() user: User) {
    return this.eventsService.clearNotificationsForUser(user.id);
  }


  @Post('/mark_seen/:notificationId')
  async markNotificationAsSeen(@Param('notificationId') notificationId: number){
    await this.eventsService.markNotificationAsSeen(notificationId);
  }

  @Post('/mark_seen_all')
  async markAllNotificationsAsSeen(@Body() IDS: any){
    const  {unseenNotificationIds}  = IDS;
    try{
    if(unseenNotificationIds.length > 1){
    for (const notificationId of unseenNotificationIds) {
      if(!check_valid_number(notificationId) || !isNumber(notificationId))
        return
      await this.eventsService.markNotificationAsSeen(notificationId);
    }
  }
}catch(error){
  return
}
return
  }
}
