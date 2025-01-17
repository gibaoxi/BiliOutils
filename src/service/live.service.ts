import { TaskModule } from '@/config';
import type { LiveRoomList } from '@/dto/live.dto';
import { PendentID } from '@/enums/live.enum';
import { getArea, getLiveInfo, getLiveRoom } from '@/net/live.request';
import { sleep, logger } from '@/utils';

export interface LiveAreaType {
  areaId: string;
  parentId: string;
  name: string;
  parentName: string;
}

/**
 * 分类检测
 */
function pendentLottery(list: LiveRoomList[]) {
  const lotteryTime: LiveRoomList[] = [],
    lotteryPacket: LiveRoomList[] = [];
  list.forEach(item => {
    const num2 = item.pendant_info['2'];
    if (!num2) {
      return;
    }
    if (num2.pendent_id === PendentID.Time) {
      lotteryTime.push(item);
    } else if (num2.pendent_id === PendentID.RedPacket) {
      lotteryPacket.push(item);
    }
  });
  return { lotteryTime, lotteryPacket };
}

/**
 * 获取直播分区
 */
export async function getLiveArea() {
  try {
    const { data, code, message } = await getArea();
    if (code !== 0) {
      logger.info(`获取直播分区失败: ${code}-${message}`);
    }
    return data.data;
  } catch (error) {
    logger.error(`获取直播分区异常：`, error);
    throw error;
  }
}

/**
 * 获取直播间列表
 * @param areaId
 * @param parentId
 * @param page
 */
export async function getLotteryRoomList(
  areaId: string,
  parentId: string,
  page = 1,
  lotType: 'lottery' | 'redPack' = 'lottery',
): Promise<LiveRoomList[]> {
  try {
    await sleep(100);
    const { data, code, message } = await getLiveRoom(parentId, areaId, page);
    if (code !== 0) {
      logger.warn(`获取直播间列表失败: ${code} ${message}`);
      throw new Error(`获取直播间列表失败: ${code} ${message}`);
    }
    return pendentLottery(data.list)[lotType === 'lottery' ? 'lotteryTime' : 'lotteryPacket'];
  } catch (error) {
    logger.error(`获取直播间列表异常：`, error);
    throw error;
  }
}

export async function getRoomid() {
  if (TaskModule.roomid) return TaskModule.roomid;
  const roomid = await requestRoomid();

  if (!roomid) {
    logger.error(`没有配置 blink.roomid 且获取直播间 id 失败`);
    return;
  }
  TaskModule.roomid = roomid;
  return roomid;
}

/**
 * 获取直播间 id
 */
export async function requestRoomid() {
  try {
    const { code, message, data } = await getLiveInfo();
    if (code !== 0) {
      logger.fatal(`获取直播间 id`, code, message);
      return;
    }
    return data.room_id;
  } catch (error) {
    logger.exception('获取直播间 id', error);
  }
}
