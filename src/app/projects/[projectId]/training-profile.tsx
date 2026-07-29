import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Circle,
  GraduationCap,
} from 'lucide-react';
import {
  toggleTrainingChecklistAction,
  updateTrainingProfileAction,
} from '@/app/actions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { getTrainingProfileForView } from '@/lib/database-data';

type TrainingProfile = NonNullable<
  Awaited<ReturnType<typeof getTrainingProfileForView>>
>;

const phases = [
  '课程大纲',
  '核算成本',
  '报价',
  '合同签署 / 招标采购',
  '筹备',
] as const;

const sectionMeta = {
  COST: {
    title: '内部成本核算',
    description: '酒店、交通、人工、讲义、餐费和胸牌只用于内部核算，成本表绝不直接发给客户。',
  },
  PREPARATION: {
    title: '筹备检查',
    description: '逐项确认费用归属、交通、报备、盖章、日程和分工。',
  },
  RESTART: {
    title: '暂停期间检查清单',
    description: '客户 postpone 后重新启动前，先复查名单、老师时间和课件更新。',
  },
} as const;

const fieldClass =
  'h-9 w-full rounded-md border border-input bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-ring';
const areaClass =
  'min-h-20 w-full resize-y rounded-md border border-input bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring';

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <span className='mb-1 block text-xs font-medium text-muted-foreground'>{children}</span>;
}

function activeChecklistSection(projectStatus: string, currentPhase: string) {
  if (projectStatus === 'PAUSED') return 'RESTART';
  if (currentPhase === '核算成本') return 'COST';
  if (currentPhase === '筹备') return 'PREPARATION';
  return '';
}

function FormSection({
  title,
  hint,
  open,
  children,
}: {
  title: string;
  hint: string;
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <details
      open={open}
      className='group rounded-lg border border-border bg-card/60'
    >
      <summary className='flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3'>
        <div className='min-w-0'>
          <h3 className='text-sm font-semibold'>{title}</h3>
          <p className='mt-1 text-xs leading-5 text-muted-foreground'>{hint}</p>
        </div>
        <ChevronDown className='h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180' />
      </summary>
      <div className='border-t border-border px-4 py-4'>{children}</div>
    </details>
  );
}

export function TrainingProfilePanel({
  profile,
  projectStatus,
}: {
  profile: TrainingProfile;
  projectStatus: string;
}) {
  const isPaused = projectStatus === 'PAUSED';
  const currentPhase = phases.includes(profile.currentPhase as (typeof phases)[number])
    ? profile.currentPhase
    : '课程大纲';
  const currentChecklistSection = activeChecklistSection(projectStatus, currentPhase);
  const groups = new Map<string, TrainingProfile['checklistItems']>();
  for (const item of profile.checklistItems) {
    const items = groups.get(item.section) ?? [];
    items.push(item);
    groups.set(item.section, items);
  }

  return (
    <Card className='mb-5'>
      <CardHeader className='border-b border-border'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <CardTitle className='flex items-center gap-2'>
            <GraduationCap className='h-4 w-4 text-primary' />
            培训项目台账
          </CardTitle>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge tone={isPaused ? 'waiting' : 'active'}>
              {isPaused ? '项目状态：已暂停' : '项目状态：进行中'}
            </Badge>
            <Badge tone='neutral'>当前阶段：{currentPhase}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className='pt-5'>
        <form action={updateTrainingProfileAction} className='space-y-4'>
          <input type='hidden' name='projectId' value={profile.projectId} />

          <FormSection
            title='课程与客户'
            hint='先定主题来源、客户对接人、主题数、培训时长、地点和人数。'
            open={currentPhase === '课程大纲'}
          >
            <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
              <label>
                <FieldLabel>当前阶段</FieldLabel>
                <select name='currentPhase' defaultValue={currentPhase} className={fieldClass}>
                  {phases.map((phase) => (
                    <option key={phase}>{phase}</option>
                  ))}
                </select>
              </label>
              <label>
                <FieldLabel>主题来源</FieldLabel>
                <select name='topicSource' defaultValue={profile.topicSource} className={fieldClass}>
                  <option value=''>待确认</option>
                  <option>客户已有明确主题</option>
                  <option>按客户业务定制</option>
                </select>
              </label>
              <label>
                <FieldLabel>客户对接人</FieldLabel>
                <input name='clientContactName' defaultValue={profile.clientContactName} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>联系方式</FieldLabel>
                <input name='clientContactInfo' defaultValue={profile.clientContactInfo} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>主题数</FieldLabel>
                <input name='topicCount' type='number' min='0' defaultValue={profile.topicCount ?? ''} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>培训人数</FieldLabel>
                <input name='participantCount' type='number' min='0' defaultValue={profile.participantCount ?? ''} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>总天数</FieldLabel>
                <input name='totalDays' type='number' min='0' step='0.5' defaultValue={profile.totalDays ?? ''} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>每日学习时长（小时）</FieldLabel>
                <input name='dailyHours' type='number' min='0' step='0.5' defaultValue={profile.dailyHours ?? ''} className={fieldClass} />
              </label>
              <label className='md:col-span-2 xl:col-span-4'>
                <FieldLabel>地点</FieldLabel>
                <input name='location' defaultValue={profile.location} className={fieldClass} />
              </label>
            </div>
          </FormSection>

          <FormSection
            title='预算、成本与报价'
            hint='成本表只用于内部核算，报价在内部核对并确认后再对外发。'
            open={currentPhase === '核算成本' || currentPhase === '报价'}
          >
            <div className='mb-3 inline-flex items-center gap-1 text-xs font-medium text-amber-700'>
              <AlertTriangle className='h-3.5 w-3.5' />
              内部成本不可对外发送
            </div>
            <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
              <label>
                <FieldLabel>预算</FieldLabel>
                <input name='budget' type='number' min='0' step='0.01' defaultValue={profile.budget ?? ''} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>币种</FieldLabel>
                <select name='currency' defaultValue={profile.currency} className={fieldClass}>
                  <option>CNY</option>
                  <option>USD</option>
                  <option>SGD</option>
                  <option>UZS</option>
                </select>
              </label>
              <label>
                <FieldLabel>报价轮次</FieldLabel>
                <input name='quoteRound' type='number' min='1' defaultValue={profile.quoteRound} className={fieldClass} />
              </label>
              <div className='flex items-end text-xs leading-5 text-muted-foreground'>
                首轮可适当留议价空间；内部核对总数并经晓卉姐确认后再出价。
              </div>
              <label className='md:col-span-2'>
                <FieldLabel>预算与费用归属</FieldLabel>
                <textarea name='costOwnership' defaultValue={profile.costOwnership} className={areaClass} />
              </label>
              <label className='md:col-span-2'>
                <FieldLabel>内部成本备注</FieldLabel>
                <textarea name='internalCostNote' defaultValue={profile.internalCostNote} className={areaClass} />
              </label>
            </div>
          </FormSection>

          <FormSection
            title='合同、采购与报备'
            hint='内部技术服务合同、客户合同、保证金、付款节点和报备清单放在这里。'
            open={currentPhase === '合同签署 / 招标采购' || currentPhase === '筹备'}
          >
            <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
              <label>
                <FieldLabel>内部合同状态（合肥院）</FieldLabel>
                <input name='internalContractStatus' defaultValue={profile.internalContractStatus} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>客户合同状态</FieldLabel>
                <input name='clientContractStatus' defaultValue={profile.clientContractStatus} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>保证金</FieldLabel>
                <input name='depositNote' defaultValue={profile.depositNote} className={fieldClass} />
              </label>
              <label>
                <FieldLabel>预付比例（%）</FieldLabel>
                <input name='prepaymentPercent' type='number' min='0' max='100' step='0.1' defaultValue={profile.prepaymentPercent ?? ''} className={fieldClass} />
              </label>
              <label className='md:col-span-2'>
                <FieldLabel>款项节点</FieldLabel>
                <textarea name='paymentMilestones' defaultValue={profile.paymentMilestones} className={areaClass} />
              </label>
              <label className='md:col-span-2'>
                <FieldLabel>报备清单状态</FieldLabel>
                <textarea name='reportingStatus' defaultValue={profile.reportingStatus} className={areaClass} />
              </label>
            </div>
          </FormSection>

          <div className='flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4'>
            <p className='text-xs leading-5 text-muted-foreground'>
              暂停或恢复请改项目详情顶部的“项目状态”，这里只保存培训字段和当前阶段。
            </p>
            <Button type='submit'>保存培训台账</Button>
          </div>
        </form>

        <div className='mt-6 grid gap-4 border-t border-border pt-5 xl:grid-cols-3'>
          {(Object.keys(sectionMeta) as Array<keyof typeof sectionMeta>).map((section) => {
            const meta = sectionMeta[section];
            const items = groups.get(section) ?? [];
            const doneCount = items.filter((item) => item.done).length;
            const open = currentChecklistSection === section;
            const disabled = section === 'RESTART' && !isPaused;

            return (
              <details
                key={section}
                open={open}
                className={cn(
                  'group rounded-lg border border-border bg-card/60',
                  disabled && 'opacity-70',
                )}
              >
                <summary className='flex cursor-pointer list-none items-start justify-between gap-3 px-4 py-3'>
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <h3 className='text-sm font-semibold'>{meta.title}</h3>
                      <span className='text-xs text-muted-foreground'>{doneCount}/{items.length}</span>
                    </div>
                    <p className='mt-1 text-xs leading-5 text-muted-foreground'>{meta.description}</p>
                  </div>
                  <ChevronDown className='mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180' />
                </summary>
                <div className='divide-y divide-border border-t border-border px-4'>
                  {items.map((item) => (
                    <form key={item.id} action={toggleTrainingChecklistAction} className='flex items-start gap-2 py-2.5'>
                      <input type='hidden' name='itemId' value={item.id} />
                      <input type='hidden' name='done' value={String(!item.done)} />
                      <button
                        type='submit'
                        title={item.done ? '标记未完成' : '标记已完成'}
                        className='mt-0.5 text-muted-foreground hover:text-primary'
                      >
                        {item.done ? (
                          <CheckCircle2 className='h-4 w-4 text-emerald-600' />
                        ) : (
                          <Circle className='h-4 w-4' />
                        )}
                      </button>
                      <div className='min-w-0'>
                        <div className={item.done ? 'text-sm text-muted-foreground line-through' : 'text-sm'}>
                          {item.label}
                        </div>
                        {item.note ? <p className='mt-1 text-xs leading-5 text-muted-foreground'>{item.note}</p> : null}
                      </div>
                    </form>
                  ))}
                </div>
              </details>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}