'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import geography from '@/lib/lessons/han-river-geography.json';
import { kingdoms, places, steps, mapQuestions } from '@/lib/lessons/han-river';

const project = ([lng,lat]) => [(lng-123.7)*90,(40.6-lat)*105];
const placeById = Object.fromEntries(places.map(p => [p.id,p]));
function owner(id, step) {
  if (id==='pyeongyang') return 'goguryeo';
  if (id==='hanseong') return ['baekje','goguryeo','baekje','silla','silla'][step];
  if (id==='upperHan') return step>=2?'silla':null;
  if (id==='geumseong'||id==='gwansan') return 'silla';
  return 'baekje';
}
function Symbol({kingdom, size=7}) {
  if(kingdom==='baekje')return <rect x={-size} y={-size} width={size*2} height={size*2} rx="1"/>;
  if(kingdom==='silla')return <path d={`M 0 ${-size-2} L ${size+2} 0 L 0 ${size+2} L ${-size-2} 0 Z`}/>;
  return <circle r={size}/>;
}
function routeGeometry(route) {
  const a=project(placeById[route.from].coordinates),b=project(placeById[route.to].coordinates);
  const length=Math.hypot(b[0]-a[0],b[1]-a[1]);
  const end=[b[0]-(b[0]-a[0])/length*17,b[1]-(b[1]-a[1])/length*17];
  const control=[(a[0]+b[0])/2+route.bend,(a[1]+b[1])/2];
  return {path:`M${a} Q${control} ${end}`,label:[(a[0]+b[0])/2+route.bend*.5+(route.labelDx||0),(a[1]+b[1])/2-13+(route.labelDy||0)]};
}
function Atlas({step, selected, onSelect, quizMode=false, feedback=null, compact=false}) {
 const stage=steps[step];
 return <svg className="hr-atlas" viewBox="100 105 510 480" role="group" aria-label={`${stage.year} 지도. 지명을 선택하면 ${quizMode?'답안을 제출합니다':'위치 설명을 읽을 수 있습니다'}`}>
  <defs>
   <pattern id="hr-grid" width="90" height="105" patternUnits="userSpaceOnUse"><path d="M90 0H0V105" fill="none" stroke="#dee8e8" strokeWidth=".65"/></pattern>
   {Object.entries(kingdoms).map(([id,k])=><marker key={id} id={`hr-arrow-${id}`} markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="userSpaceOnUse"><path d="M0 0L9 4.5L0 9Z" fill={k.color}/></marker>)}
  </defs>
  <rect x="0" y="0" width="640" height="700" fill="#edf3f3"/><rect x="0" y="0" width="640" height="700" fill="url(#hr-grid)"/>
  <g className="hr-land">{geography.land.map((d,i)=><path key={i} d={d} fill="#fdfbf5" stroke="#fdfbf5" strokeWidth="1.5"/>)}</g>
  <text x="125" y="420" className="hr-sea">서 해</text><text x="530" y="305" className="hr-sea">동 해</text>
  <g transform="translate(550 125)" className="hr-north"><path d="M0 25V0M-5 9L0 0L5 9"/><text x="0" y="-8" textAnchor="middle">N</text></g>
  {geography.rivers.map((river,i)=><path key={`halo-${i}`} d={river.path} fill="none" stroke="#bfd7dd" strokeWidth="10" opacity=".45"/>)}
  {geography.rivers.map((river,i)=><path key={i} d={river.path} fill="none" stroke="#6c9fae" strokeWidth="2.7" strokeLinecap="round"/>)}
  <text x="380" y="297" className="hr-river-label">한 강</text>
  {!quizMode && <g key={stage.id} className="hr-routes">{stage.route.map((route,i)=>{const geo=routeGeometry(route);return <g key={i}><path d={geo.path} fill="none" stroke={kingdoms[route.kingdom].color} strokeWidth="3.3" strokeDasharray={route.dashed?'7 5':undefined} markerEnd={`url(#hr-arrow-${route.kingdom})`}/><text x={geo.label[0]} y={geo.label[1]} textAnchor="middle" className="hr-route-label" fill={kingdoms[route.kingdom].color}>{route.label}</text></g>;})}</g>}
  {places.filter(p=>!(p.id==='upperHan'&&step<2)).map(p=>{
   const [x,y]=project(p.coordinates),k=owner(p.id,step),active=!quizMode&&stage.focus.includes(p.id),chosen=selected===p.id;
   const note=p.id==='hanseong'&&step>=2?(quizMode?'하류 방면':`하류 · ${kingdoms[k].name}`):p.id==='upperHan'?(quizMode?'상류 방면':'상류 · 신라'):null;
   return <g key={p.id} transform={`translate(${x} ${y})`} className={`hr-place ${active?'is-focus':''} ${chosen?'is-chosen':''}`} role="button" tabIndex={0} aria-label={`${p.name}, ${p.modern}${quizMode?' 선택':''}`} onClick={()=>onSelect(p.id)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();onSelect(p.id);}}}>
    <title>{`${p.name} · ${p.modern}`}</title><circle r="23" fill="transparent"/>
    {active&&<circle r={p.id==='gwansan'?22:18} fill="none" stroke={kingdoms[k]?.color||'#65746d'} strokeWidth="1.5" strokeDasharray={p.id==='gwansan'?'3 3':undefined} opacity=".55"/>}
    {chosen&&<circle r="24" fill="none" stroke={feedback==='wrong'?'#c26a47':'#244e45'} strokeWidth="3"/>}
    <g fill={quizMode?'#607a75':active?kingdoms[k]?.color:'#a0aaa0'} stroke="#fffdf8" strokeWidth="2"><Symbol kingdom={quizMode||!active?'goguryeo':k} size={quizMode||active?7:4}/></g>
    {(quizMode||step!==4||p.id!=='ungjin')&&<text x={p.dx} y={p.dy} textAnchor={p.anchor||'start'} className="hr-place-label" opacity={quizMode||active?1:.58}>{p.name}</text>}
    {note&&(quizMode||active)&&<text x={p.id==='upperHan'?18:p.dx} y={p.dy+20} textAnchor={p.anchor||'start'} className="hr-owner-label" fill={quizMode?'#607a75':kingdoms[k].color}>{note}</text>}
   </g>;
  })}
 </svg>;
}
export default function HanRiverLesson() {
 const [step,setStep]=useState(0),[selected,setSelected]=useState(null),[mode,setMode]=useState('lesson'),[questionIndex,setQuestionIndex]=useState(0),[answers,setAnswers]=useState({}),[compact,setCompact]=useState(false),[finished,setFinished]=useState(false);
 const titleRef=useRef(null);const mapPanelRef=useRef(null);const stage=steps[step],question=mapQuestions[questionIndex],answer=answers[question?.id];
 useEffect(()=>{const query=window.matchMedia('(max-width: 760px)');const change=()=>setCompact(query.matches);change();query.addEventListener('change',change);return()=>query.removeEventListener('change',change);},[]);
 function showMap(){if(compact)requestAnimationFrame(()=>mapPanelRef.current?.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'}));}
 function go(next){setStep(Math.min(steps.length-1,Math.max(0,next)));setSelected(null);showMap();}
 function startQuestions(){setMode('quiz');setQuestionIndex(0);setAnswers({});setFinished(false);setStep(mapQuestions[0].step);setSelected(null);showMap();}
 function selectPlace(id){if(mode==='quiz'){if(answer||finished)return;setAnswers(a=>({...a,[question.id]:id}));}setSelected(id);}
 function nextQuestion(){if(!answer)return;if(questionIndex===mapQuestions.length-1){setFinished(true);return;}setQuestionIndex(questionIndex+1);setStep(mapQuestions[questionIndex+1].step);setSelected(null);showMap();}
 function lessonMode(){setMode('lesson');setSelected(null);setFinished(false);}
 function keyNavigation(event){if(mode!=='lesson'||event.target.closest('input,textarea,select')||event.altKey||event.ctrlKey||event.metaKey)return;if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();go(step+(event.key==='ArrowRight'?1:-1));}}
 return <main className="hr-page" onKeyDown={keyNavigation}>
  <header className="hr-header"><Link href="/study/korean-history/" className="hr-back">← 한국사 학습</Link><span className="hr-header-label">IUM 지도 탐구 <b>01</b></span><button className="hr-mode-button" onClick={mode==='lesson'?startQuestions:lessonMode}>{mode==='lesson'?'지도에서 확인하기 ↗':'수업으로 돌아가기'}</button></header>
  <div className="hr-heading"><div><p className="hr-kicker">삼국의 성장과 한강 쟁탈</p><h1>같은 한강,<br className="hr-mobile-break"/> 달라지는 세 나라.</h1></div><p className="hr-heading-note">연도를 바꾸면, 역사가 움직입니다.<br/>지도 위 지명을 눌러 위치를 확인하세요.</p></div>
  <nav className="hr-timeline" aria-label="역사 단계">{steps.map((s,i)=><button key={s.id} aria-current={i===step?'step':undefined} onClick={()=>{setMode('lesson');setFinished(false);go(i);}}><span className="hr-timeline-dot" style={{'--kingdom':kingdoms[s.kingdom].color}}/><strong>{s.year}</strong><span>{s.short}</span></button>)}</nav>
  <div className="hr-workspace">
   <section ref={mapPanelRef} className="hr-map-panel" aria-label="단계별 역사 지도">
    <div className="hr-map-top"><span className="hr-map-date">{stage.year}</span><span>{mode==='quiz'?'지도를 눌러 답하세요':stage.river}</span></div>
    <div className="hr-map-wrap"><Atlas step={step} selected={selected} onSelect={selectPlace} quizMode={mode==='quiz'} feedback={mode==='quiz'&&answer?(selected===question.answer?'correct':'wrong'):null} compact={compact}/></div>
    <div className="hr-map-bottom"><div className="hr-legend">{mode==='quiz'?<span><i className="hr-neutral-key"/>지명 선택</span>:Object.entries(kingdoms).map(([id,k])=><span key={id}><svg width="16" height="16" viewBox="-10 -10 20 20" fill={k.color}><Symbol kingdom={id} size={5}/></svg>{k.name}</span>)}<span><i className="hr-river-key"/>한강</span></div><small>현대 지형을 바탕으로 한 개념도 · 정확한 국경·행군로가 아닙니다.</small></div>
   </section>
   <aside className="hr-story-panel" aria-label={mode==='lesson'?'이 단계의 설명':'지도 확인 문제'}>
    {mode==='lesson'?<>
     <p className="hr-step-count">장면 {String(step+1).padStart(2,'0')} / 05 <span>{stage.date}</span></p>
     <h2 ref={titleRef} tabIndex={-1}>{stage.title}</h2>
     <div className="hr-story-block"><span>왜?</span><p>{stage.why}</p></div>
     <div className="hr-story-block hr-change"><span>무엇이 바뀌었나</span><p>{stage.change}</p></div>
     <div className="hr-story-block"><span>그래서</span><p>{stage.result}</p></div>
     <div className="hr-look"><span>지도를 읽는 질문</span><strong>{stage.question}</strong></div>
     {selected&&<div className="hr-place-detail" aria-live="polite"><button aria-label="위치 설명 닫기" onClick={()=>setSelected(null)}>×</button><strong>{placeById[selected].name}</strong><small>{placeById[selected].modern}</small><p>{placeById[selected].note}</p></div>}
     <div className="hr-story-navigation"><button onClick={()=>go(step-1)} disabled={step===0}>← 이전</button><button className="hr-next" onClick={step===4?startQuestions:()=>go(step+1)}>{step===4?'이제 지도에서 확인 →':'다음 장면 →'}</button></div>
    </>:finished?<div className="hr-quiz-result"><p className="hr-kicker">지도 탐구 완료</p><h2>위치와 흐름이<br/>연결되었나요?</h2><strong>{mapQuestions.filter(q=>answers[q.id]===q.answer).length}<span> / {mapQuestions.length}</span></strong><p>이번 수업의 자체 제작 확인 문제 결과입니다. 기존 140문제 학습 기록과는 별도로 진행됩니다.</p><button className="hr-next" onClick={startQuestions}>지도 문제 다시 풀기</button><button onClick={lessonMode}>5개 장면 다시 보기</button></div>:<>
     <p className="hr-step-count">지도 확인 {questionIndex+1} / {mapQuestions.length}</p><h2>{question.prompt}</h2><p className="hr-quiz-help">지도 위 점을 누르거나 아래 지명을 선택하세요.</p>
     <div className="hr-answer-places">{places.filter(p=>!(p.id==='upperHan'&&step<2)).map(p=><button key={p.id} disabled={Boolean(answer)} className={answer===p.id?'is-selected':''} onClick={()=>selectPlace(p.id)}>{p.name}</button>)}</div>
     {answer&&<div className="hr-feedback" role="status"><strong>{answer===question.answer?'맞았습니다.':`정답은 ${placeById[question.answer].name}입니다.`}</strong><p>{question.explanation}</p><button onClick={()=>setSelected(question.answer)}>정답 위치 강조하기 ◎</button><button className="hr-next" onClick={nextQuestion}>{questionIndex===mapQuestions.length-1?'결과 보기 →':'다음 지도 문제 →'}</button></div>}
    </>}
   </aside>
  </div>

  {mode==='lesson'&&<section className="hr-understanding"><div className="hr-comparison"><h2>같은 시간, 다른 왕</h2><div>{Object.entries(kingdoms).map(([id,k])=><p key={id}><span style={{color:k.color}}>{k.name}</span><strong>{stage.compare[id]}</strong></p>)}</div></div><div className="hr-river-reason"><h2>왜 모두 한강으로 향했을까요?</h2><p>생산 기반이 되는 농경지와 인구, 내륙과 서해를 잇는 교통로가 만나는 곳이었습니다. 한강 확보는 성장의 중요한 조건이었지만, 그것만으로 통일이 결정된 것은 아닙니다.</p></div></section>}
  <footer className="hr-footer"><details><summary>역사·지도 근거와 표현 범위</summary><p>화살표는 공격·확보·천도의 방향을 단순화했습니다. 당시의 정확한 행군로와 국경은 표시하지 않았습니다. 551년의 6군·10군 위치에는 불명확한 부분이 있습니다. 지명은 현대 지역의 대표점이며 성곽의 정확한 발굴 좌표가 아닙니다.</p><ul>{(stage.sources||[]).map((source,i)=><li key={source}><a href={source} target="_blank" rel="noopener noreferrer">이 장면 역사 근거 {i+1} ↗</a></li>)}{geography.sources.map((source,i)=><li key={source}><a href={source} target="_blank" rel="noopener noreferrer">Natural Earth {i===0?'육지 윤곽':'한강 수계'} · Public domain ↗</a></li>)}</ul></details><span>← → 키로 장면 이동 · 지도는 네트워크 없이 표시됩니다.</span></footer>
 </main>;
}
