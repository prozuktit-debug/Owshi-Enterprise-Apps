import React, {useEffect, useState} from 'react';
import {SafeAreaView, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet} from 'react-native';
import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';

const db = SQLite.openDatabaseSync('owshi_enterprise.db');
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = SUPABASE_URL && SUPABASE_ANON_KEY ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const T = {
  bn: {app:'ঔশি এন্টারপ্রাইজ',login:'লগইন',username:'ইমেইল / ইউজার আইডি',password:'পাসওয়ার্ড',enter:'প্রবেশ করুন',dashboard:'ড্যাশবোর্ড',trips:'ট্রিপ',parties:'পার্টি',vehicles:'গাড়ি',maintenance:'মেরামত',staff:'স্টাফ বিল',documents:'ডকুমেন্ট',reports:'রিপোর্ট',demurrage:'ডেমারেজ ক্যালকুলেটর',settings:'সেটিংস',add:'নতুন যোগ করুন',save:'সংরক্ষণ',back:'ফিরে যান',fare:'ভাড়া',advance:'অগ্রিম',due:'বকেয়া',party:'পার্টির নাম',vehicle:'গাড়ির নম্বর',date:'তারিখ (YYYY-MM-DD)',freeDays:'ফ্রি দিন',demDays:'ডেমারেজ দিন',rate:'দৈনিক ডেমারেজ',amount:'টাকার পরিমাণ',description:'বিবরণ',total:'মোট',income:'মোট ভাড়া',expenses:'মোট খরচ',logout:'লগআউট',sync:'ক্লাউড সিঙ্ক',language:'ভাষা',noData:'এখনো কোনো তথ্য নেই',tripSaved:'ট্রিপ সংরক্ষণ হয়েছে',role:'ভূমিকা'},
  en: {app:'Owshi Enterprise',login:'Login',username:'Email / User ID',password:'Password',enter:'Sign in',dashboard:'Dashboard',trips:'Trips',parties:'Parties',vehicles:'Vehicles',maintenance:'Maintenance',staff:'Staff Bills',documents:'Documents',reports:'Reports',demurrage:'Demurrage Calculator',settings:'Settings',add:'Add new',save:'Save',back:'Back',fare:'Fare',advance:'Advance',due:'Due',party:'Party name',vehicle:'Vehicle number',date:'Date (YYYY-MM-DD)',freeDays:'Free days',demDays:'Demurrage days',rate:'Daily demurrage',amount:'Amount',description:'Description',total:'Total',income:'Total fare',expenses:'Total expenses',logout:'Logout',sync:'Cloud sync',language:'Language',noData:'No records yet',tripSaved:'Trip saved',role:'Role'}
};

const modules = [
  ['trips','trips'],['parties','parties'],['vehicles','vehicles'],['maintenance','maintenance'],
  ['staff','staff'],['documents','documents'],['reports','reports'],['demurrage','demurrage']
];

function money(n){return '৳ '+Number(n||0).toLocaleString('en-BD');}
function Field({label,value,onChange,keyboardType='default',placeholder}) {
  return <View style={{marginBottom:10}}><Text style={s.label}>{label}</Text><TextInput style={s.input} value={value} onChangeText={onChange} keyboardType={keyboardType} placeholder={placeholder || label}/></View>;
}
function Btn({title,onPress,secondary=false}) {
  return <TouchableOpacity onPress={onPress} style={[s.btn,secondary&&s.btn2]}><Text style={[s.btnText,secondary&&s.btnText2]}>{title}</Text></TouchableOpacity>;
}

export default function App(){
  const [lang,setLang]=useState('bn'), [user,setUser]=useState(null), [page,setPage]=useState('dashboard');
  const [records,setRecords]=useState([]), [summary,setSummary]=useState({trips:0,income:0,advance:0,due:0,expenses:0});
  const [form,setForm]=useState({}), [filter,setFilter]=useState('');
  const t=T[lang];

  useEffect(()=>{
    db.execSync(`CREATE TABLE IF NOT EXISTS trips(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, party TEXT, vehicle TEXT, fare REAL, advance REAL, free_days INTEGER, dem_days INTEGER, dem_rate REAL, dem_amount REAL, note TEXT, synced INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS parties(id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, address TEXT, synced INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS vehicles(id INTEGER PRIMARY KEY AUTOINCREMENT, number TEXT, type TEXT, driver TEXT, fitness TEXT, tax_token TEXT, insurance TEXT, synced INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS maintenance(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, vehicle TEXT, description TEXT, amount REAL, garage TEXT, synced INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS staff(id INTEGER PRIMARY KEY AUTOINCREMENT, date TEXT, person TEXT, category TEXT, amount REAL, note TEXT, synced INTEGER DEFAULT 0);
    CREATE TABLE IF NOT EXISTS documents(id INTEGER PRIMARY KEY AUTOINCREMENT, vehicle TEXT, doc_type TEXT, expiry TEXT, note TEXT, synced INTEGER DEFAULT 0);`);
    AsyncStorage.getItem('owshi_user').then(v=>{if(v)setUser(JSON.parse(v));});
  },[]);
  useEffect(()=>{if(user)loadSummary();},[user,page]);

  function loadSummary(){
    const a=db.getFirstSync('SELECT COUNT(*) c, COALESCE(SUM(fare),0) income, COALESCE(SUM(advance),0) advance, COALESCE(SUM(fare-advance),0) due FROM trips');
    const b=db.getFirstSync('SELECT COALESCE(SUM(amount),0) expenses FROM (SELECT amount FROM maintenance UNION ALL SELECT amount FROM staff)');
    setSummary({trips:a.c,income:a.income,advance:a.advance,due:a.due,expenses:b.expenses});
    if(page!=='dashboard') loadRecords();
  }
  function loadRecords(){
    const map={trips:'trips',parties:'parties',vehicles:'vehicles',maintenance:'maintenance',staff:'staff',documents:'documents'};
    if(map[page]) setRecords(db.getAllSync(`SELECT * FROM ${map[page]} ORDER BY id DESC LIMIT 100`));
    else setRecords([]);
  }
  async function login(){
    const email=String(form.email||'').trim(), password=String(form.password||'');
    if(!email||!password){Alert.alert(t.login,'Enter your login details');return;}
    // Cloud login is used when Supabase is configured. A local demo login is available for initial testing.
    if(supabase){
      const {data,error}=await supabase.auth.signInWithPassword({email,password});
      if(error){Alert.alert('Login failed',error.message);return;}
      const profile=data.user?.user_metadata||{};
      const u={email,role:profile.role||'Manager',name:profile.name||email};
      setUser(u); await AsyncStorage.setItem('owshi_user',JSON.stringify(u));
    } else if(email==='admin' && password==='123456'){
      const u={email:'admin',role:'Admin',name:'Administrator'};
      setUser(u); await AsyncStorage.setItem('owshi_user',JSON.stringify(u));
      Alert.alert('Demo login','ডেমো লগইন চলছে। বাস্তব বহু-ব্যবহারকারী লগইনের জন্য Supabase কনফিগার করুন।');
    } else Alert.alert('Login','Supabase সেটআপ না করা পর্যন্ত demo: admin / 123456');
  }
  async function logout(){await AsyncStorage.removeItem('owshi_user');setUser(null);setPage('dashboard');}
  function open(p){setPage(p);setForm({});setFilter('');}
  function saveRecord(){
    const num=x=>Number(x||0);
    try{
      if(page==='trips'){
        const demDays=Math.max(0,num(form.dem_days)), demAmount=demDays*num(form.dem_rate);
        db.runSync('INSERT INTO trips(date,party,vehicle,fare,advance,free_days,dem_days,dem_rate,dem_amount,note) VALUES(?,?,?,?,?,?,?,?,?,?)',
          [form.date||new Date().toISOString().slice(0,10),form.party||'',form.vehicle||'',num(form.fare),num(form.advance),num(form.free_days),demDays,num(form.dem_rate),demAmount,form.note||'']);
      } else if(page==='parties') db.runSync('INSERT INTO parties(name,phone,address) VALUES(?,?,?)',[form.name||'',form.phone||'',form.address||'']);
      else if(page==='vehicles') db.runSync('INSERT INTO vehicles(number,type,driver,fitness,tax_token,insurance) VALUES(?,?,?,?,?,?)',[form.number||'',form.type||'',form.driver||'',form.fitness||'',form.tax_token||'',form.insurance||'']);
      else if(page==='maintenance') db.runSync('INSERT INTO maintenance(date,vehicle,description,amount,garage) VALUES(?,?,?,?,?)',[form.date||'',form.vehicle||'',form.description||'',num(form.amount),form.garage||'']);
      else if(page==='staff') db.runSync('INSERT INTO staff(date,person,category,amount,note) VALUES(?,?,?,?,?)',[form.date||'',form.person||'',form.category||'',num(form.amount),form.note||'']);
      else if(page==='documents') db.runSync('INSERT INTO documents(vehicle,doc_type,expiry,note) VALUES(?,?,?,?)',[form.vehicle||'',form.doc_type||'',form.expiry||'',form.note||'']);
      setForm({}); loadSummary(); loadRecords(); Alert.alert(t.save,'তথ্য সংরক্ষণ হয়েছে');
    }catch(e){Alert.alert('Error',String(e));}
  }
  async function syncCloud(){
    if(!supabase){Alert.alert('Cloud sync','আগে Supabase URL ও Anon Key সেট করুন।');return;}
    const tables=['trips','parties','vehicles','maintenance','staff','documents'];
    try{
      for(const table of tables){
        const rows=db.getAllSync(`SELECT * FROM ${table} WHERE synced=0`);
        if(rows.length){
          const {error}=await supabase.from('app_records').insert(rows.map(r=>({table_name:table,local_id:r.id,payload:r})));
          if(error) throw error;
          db.runSync(`UPDATE ${table} SET synced=1 WHERE synced=0`);
        }
      }
      Alert.alert('Sync','ক্লাউডে সিঙ্ক সম্পন্ন হয়েছে');
    }catch(e){Alert.alert('Sync error',e.message||String(e));}
  }
  const set=(k,v)=>setForm(old=>({...old,[k]:v}));
  const title=modules.find(x=>x[0]===page)?.[1];
  const input=(key,label,type)=> <Field key={key} label={label} value={String(form[key]??'')} keyboardType={type||'default'} onChange={v=>set(key,v)}/>;
  const card=(label,value)=> <View style={s.stat}><Text style={s.statLabel}>{label}</Text><Text style={s.statValue}>{value}</Text></View>;

  if(!user) return <SafeAreaView style={s.screen}><View style={s.loginBox}>
    <Text style={s.logo}>OWSHI</Text><Text style={s.heading}>{t.app}</Text><Text style={s.sub}>Transport Management System</Text>
    <Field label={t.username} value={form.email||''} onChange={v=>set('email',v)}/>
    <Field label={t.password} value={form.password||''} onChange={v=>set('password',v)}/>
    <Btn title={t.enter} onPress={login}/>
    <Text style={s.hint}>Demo: admin / 123456</Text>
    <Btn title="বাংলা / English" secondary onPress={()=>setLang(lang==='bn'?'en':'bn')}/>
  </View></SafeAreaView>;

  return <SafeAreaView style={s.screen}>
    <View style={s.header}><View><Text style={s.brand}>{t.app}</Text><Text style={s.sub}>{user.name} • {user.role}</Text></View><TouchableOpacity onPress={()=>setLang(lang==='bn'?'en':'bn')}><Text style={s.lang}>{lang==='bn'?'EN':'বাংলা'}</Text></TouchableOpacity></View>
    <ScrollView contentContainerStyle={s.content}>
      {page==='dashboard' ? <>
        <Text style={s.heading}>{t.dashboard}</Text>
        <View style={s.stats}>{card(t.trips,summary.trips)}{card(t.income,money(summary.income))}{card(t.advance,money(summary.advance))}{card(t.due,money(summary.due))}{card(t.expenses,money(summary.expenses))}{card('Net / নিট',money(summary.income+getDemTotal()-summary.expenses))}</View>
        <Text style={s.section}>মডিউলসমূহ / Modules</Text>
        <View style={s.menu}>{modules.map(([p,k])=><TouchableOpacity key={p} style={s.menuItem} onPress={()=>open(p)}><Text style={s.menuText}>{t[k]}</Text><Text style={s.arrow}>›</Text></TouchableOpacity>)}</View>
        <Btn title={t.sync} onPress={syncCloud} secondary/>
        <Btn title={t.logout} onPress={logout} secondary/>
      </> : page==='demurrage' ? <>
        <Btn title={t.back} onPress={()=>open('dashboard')} secondary/><Text style={s.heading}>{t.demurrage}</Text>
        {input('free_days',t.freeDays,'numeric')}{input('total_days','মোট অবস্থানের দিন / Total days','numeric')}{input('dem_rate',t.rate,'numeric')}
        <View style={s.result}><Text style={s.statLabel}>{t.demDays}</Text><Text style={s.statValue}>{Math.max(0,Number(form.total_days||0)-Number(form.free_days||0))} দিন</Text><Text style={s.statLabel}>{t.total}</Text><Text style={s.statValue}>{money(Math.max(0,Number(form.total_days||0)-Number(form.free_days||0))*Number(form.dem_rate||0))}</Text></View>
      </> : page==='reports' ? <>
        <Btn title={t.back} onPress={()=>open('dashboard')} secondary/><Text style={s.heading}>{t.reports}</Text>
        {card(t.trips,summary.trips)}{card(t.income,money(summary.income))}{card(t.advance,money(summary.advance))}{card(t.due,money(summary.due))}{card(t.expenses,money(summary.expenses))}{card('Demurrage',money(getDemTotal()))}
        <Text style={s.hint}>প্রাথমিক রিপোর্ট। পরবর্তী সংস্করণে তারিখভিত্তিক PDF ও Excel export যুক্ত করা যাবে।</Text>
      </> : <>
        <Btn title={t.back} onPress={()=>open('dashboard')} secondary/><Text style={s.heading}>{t[page]||page}</Text>
        <Text style={s.section}>{t.add}</Text>
        {page==='trips' ? <>{input('date',t.date)}{input('party',t.party)}{input('vehicle',t.vehicle)}{input('fare',t.fare,'numeric')}{input('advance',t.advance,'numeric')}{input('free_days',t.freeDays,'numeric')}{input('dem_days',t.demDays,'numeric')}{input('dem_rate',t.rate,'numeric')}{input('note',t.description)}<Text style={s.hint}>বকেয়া: {money(Number(form.fare||0)-Number(form.advance||0))} • ডেমারেজ: {money(Number(form.dem_days||0)*Number(form.dem_rate||0))}</Text></> : null}
        {page==='parties' ? <>{input('name',t.party)}{input('phone','মোবাইল / Phone')}{input('address','ঠিকানা / Address')}</>:null}
        {page==='vehicles' ? <>{input('number',t.vehicle)}{input('type','গাড়ির ধরন / Type')}{input('driver','ড্রাইভার / Driver')}{input('fitness','ফিটনেস মেয়াদ / Fitness expiry')}{input('tax_token','ট্যাক্স টোকেন / Tax token')}{input('insurance','ইন্স্যুরেন্স / Insurance')}</>:null}
        {page==='maintenance' ? <>{input('date',t.date)}{input('vehicle',t.vehicle)}{input('description',t.description)}{input('garage','গ্যারেজ / ওয়ার্কশপ')}{input('amount',t.amount,'numeric')}</>:null}
        {page==='staff' ? <>{input('date',t.date)}{input('person','নাম / Name')}{input('category','ধরন: Driver / Helper')}{input('amount',t.amount,'numeric')}{input('note',t.description)}</>:null}
        {page==='documents' ? <>{input('vehicle',t.vehicle)}{input('doc_type','ডকুমেন্টের ধরন / Document type')}{input('expiry','মেয়াদ শেষ / Expiry date')}{input('note',t.description)}</>:null}
        <Btn title={t.save} onPress={saveRecord}/>
        <Text style={s.section}>সাম্প্রতিক তথ্য / Recent records</Text>
        {records.length===0?<Text style={s.hint}>{t.noData}</Text>:records.map(r=><View key={r.id} style={s.record}><Text style={s.recordTitle}>#{r.id} {r.party||r.name||r.number||r.person||r.vehicle||r.description||r.doc_type}</Text><Text style={s.recordText}>{r.date||r.expiry||''}  {r.fare!==undefined?money(r.fare):r.amount!==undefined?money(r.amount):''}</Text>{r.fare!==undefined?<Text style={s.recordText}>Advance {money(r.advance)} • Due {money(r.fare-r.advance)} • Demurrage {money(r.dem_amount)}</Text>:null}</View>)}
      </>}
    </ScrollView>
    <View style={s.footer}><Text style={s.footerText}>OWSHI ENTERPRISE • TMS</Text></View>
  </SafeAreaView>;

  function getDemTotal(){return db.getFirstSync('SELECT COALESCE(SUM(dem_amount),0) v FROM trips')?.v||0;}
}

const s=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#F3F6FA'},header:{backgroundColor:'#102A43',padding:18,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  brand:{fontSize:20,fontWeight:'800',color:'#fff'},sub:{fontSize:12,color:'#D5E3F0',marginTop:3},lang:{color:'#fff',fontWeight:'700',padding:8,borderWidth:1,borderColor:'#789'},content:{padding:16,paddingBottom:28},
  loginBox:{margin:22,marginTop:70,backgroundColor:'#fff',padding:22,borderRadius:18,elevation:3},logo:{fontSize:30,fontWeight:'900',color:'#16836B',textAlign:'center'},heading:{fontSize:23,fontWeight:'800',color:'#102A43',marginTop:8,marginBottom:14},section:{fontSize:16,fontWeight:'800',color:'#102A43',marginTop:18,marginBottom:10},
  label:{fontSize:13,fontWeight:'700',color:'#425466',marginBottom:5},input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#D5DEE8',borderRadius:10,paddingHorizontal:12,paddingVertical:11,fontSize:15,color:'#102A43'},
  btn:{backgroundColor:'#16836B',padding:14,borderRadius:10,alignItems:'center',marginTop:8,marginBottom:6},btnText:{color:'#fff',fontWeight:'800',fontSize:15},btn2:{backgroundColor:'#E4EDF3'},btnText2:{color:'#102A43'},
  hint:{fontSize:12,color:'#657786',marginVertical:8},stats:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},stat:{width:'48%',backgroundColor:'#fff',padding:14,borderRadius:12,marginBottom:10,borderWidth:1,borderColor:'#E2E8EF'},statLabel:{fontSize:12,color:'#657786'},statValue:{fontSize:19,fontWeight:'800',color:'#102A43',marginTop:5},
  menu:{flexDirection:'row',flexWrap:'wrap',justifyContent:'space-between'},menuItem:{width:'48%',backgroundColor:'#fff',padding:15,borderRadius:12,marginBottom:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderWidth:1,borderColor:'#E2E8EF'},menuText:{fontWeight:'700',color:'#102A43'},arrow:{fontSize:22,color:'#16836B'},result:{backgroundColor:'#fff',padding:18,borderRadius:12,marginTop:10},record:{backgroundColor:'#fff',padding:13,borderRadius:10,marginBottom:8,borderWidth:1,borderColor:'#E2E8EF'},recordTitle:{fontWeight:'800',color:'#102A43'},recordText:{fontSize:12,color:'#657786',marginTop:4},footer:{padding:9,alignItems:'center'},footerText:{fontSize:10,color:'#8293A3',letterSpacing:1}
});
