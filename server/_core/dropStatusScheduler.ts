import * as cron from "node-cron";
import { updateDropStatusesAutomatically } from "../db";

/**
 * Drop 상태 자동 업데이트 스케줄러
 * 매분마다 실행되어 현재 시간에 따라 Drop 상태를 자동으로 변경합니다
 * upcoming → active → ended
 */

let scheduledTask: ReturnType<typeof cron.schedule> | null = null;

/**
 * 스케줄러 시작
 * 서버 시작 시 호출되어야 합니다
 */
export function startDropStatusScheduler() {
  if (scheduledTask) {
    console.log("[Drop Status Scheduler] 이미 실행 중입니다");
    return;
  }

  // 매분 0초에 실행 (매분마다)
  scheduledTask = cron.schedule("0 * * * * *", async () => {
    try {
      const updatedCount = await updateDropStatusesAutomatically();
      if (updatedCount > 0) {
        console.log(`[Drop Status Scheduler] ${updatedCount}개의 Drop 상태가 업데이트되었습니다`);
      }
    } catch (error) {
      console.error("[Drop Status Scheduler] 오류 발생:", error);
    }
  });

  console.log("[Drop Status Scheduler] 시작되었습니다 (매분마다 실행)");
}

/**
 * 스케줄러 중지
 * 서버 종료 시 호출되어야 합니다
 */
export function stopDropStatusScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[Drop Status Scheduler] 중지되었습니다");
  }
}

/**
 * 스케줄러 상태 확인
 */
export function isDropStatusSchedulerRunning(): boolean {
  return scheduledTask !== null;
}

/**
 * 수동으로 Drop 상태 업데이트 실행
 * 테스트나 즉시 업데이트가 필요할 때 사용
 */
export async function manuallyUpdateDropStatuses() {
  try {
    const updatedCount = await updateDropStatusesAutomatically();
    console.log(`[Drop Status Scheduler] 수동 업데이트 완료: ${updatedCount}개 업데이트됨`);
    return updatedCount;
  } catch (error) {
    console.error("[Drop Status Scheduler] 수동 업데이트 중 오류:", error);
    throw error;
  }
}
