import { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { withServerSideAuth } from '@clerk/nextjs/ssr';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

export const getServerSideProps = withServerSideAuth();

export default function Dashboard() {
  const [goalWeight, setGoalWeight] = useState(null);
  const [goalBodyFat, setGoalBodyFat] = useState(null);
  const [trainingDays, setTrainingDays] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [latestFrontPhoto, setLatestFrontPhoto] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [leanBodyMass, setLeanBodyMass] = useState('');
  const [latestSidePhoto, setLatestSidePhoto] = useState('');
  const [latestBackPhoto, setLatestBackPhoto] = useState('');
  const [checkinHistory, setCheckinHistory] = useState([]);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [todayQueueIndex, setTodayQueueIndex] = useState(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [customName, setCustomName] = useState('');
  const [customExercises, setCustomExercises] = useState([{ name: '', sets: 3, reps: [10, 12] }]);
  const [selectedWorkoutIndex, setSelectedWorkoutIndex] = useState(null);
  const router = useRouter();
  
  const [trainingLogs, setTrainingLogs] = useState([]);
  const [nutrition, setNutrition] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);
  const [savedMealPlans, setSavedMealPlans] = useState([]);
  
  useEffect(() => {
    const fetchNutrition = async () => {
    const res = await fetch('/api/nutrition/latest?userId=user-123');
      if (res.ok) {
        const data = await res.json();
        setNutrition(data);
      }
    };
    fetchNutrition();
  }, []);
  
  useEffect(() => {
    const checkReplanTrigger = async () => {
      if (!checkinHistory.length || !goalWeight || !leanBodyMass) return;
  
      const currentWeight = parseFloat(leanBodyMass) / (1 - parseFloat(bodyFat) / 100);
      const goal = parseFloat(goalWeight);
      const lastCheckin = checkinHistory[0];
      const weeksTracked = checkinHistory.length;
  
      const plateau = weeksTracked >= 2 && Math.abs(currentWeight - parseFloat(checkinHistory[1]?.leanBodyMass) / (1 - parseFloat(checkinHistory[1]?.bodyFat) / 100)) < 0.5;
  
      if (plateau || Math.abs(currentWeight - goal) > 10) {
        const regenerate = confirm('⚠️ Progress has plateaued or deviated. Would you like to regenerate a new nutrition plan now?');
        if (regenerate) {
          const res = await fetch('/api/mealplan/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'user-123' })
          });
          if (res.ok) {
            const data = await res.json();
            setMealPlan(data.plan);
            setActiveTab('mealplan');

            // Auto-save regenerated plan
            await fetch('/api/mealplan/save', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: 'user-123',
                plan: data.plan,
                name: `Auto-Replan (${new Date().toLocaleDateString()})`,
                isFavorite: false
              })
            });
          } else {
            alert('Failed to regenerate meal plan.');
          }
        }
      }
    };
  
    checkReplanTrigger();
  }, [checkinHistory, goalWeight, leanBodyMass, bodyFat]);

  useEffect(() => {
    const fetchMealPlan = async () => {
      const latest = await fetch('/api/mealplan/latest?userId=user-123');
      if (latest.ok) {
        const data = await latest.json();
        setMealPlan(data.plan);
      } else {
        const generated = await fetch('/api/mealplan/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: 'user-123' })
        });
        if (generated.ok) {
          const data = await generated.json();
          setMealPlan(data.plan);
        }
      }
    };
    fetchMealPlan();
  }, []);

  useEffect(() => {
    const fetchSavedPlans = async () => {
      const res = await fetch('/api/mealplan/list?userId=user-123');
      if (res.ok) {
        const data = await res.json();
        const sortedPlans = data.plans.sort((a, b) => {
          if (a.isFavorite === b.isFavorite) {
            return new Date(b.createdAt) - new Date(a.createdAt); // Newest first
          }
          return b.isFavorite - a.isFavorite; // Favorites on top
        });
        setSavedMealPlans(sortedPlans);
      }
    };
    fetchSavedPlans();
  }, []);
  
  useEffect(() => {
    const fetchLogs = async () => {
      const res = await fetch('/api/training/logs?userId=user-123');
      const data = await res.json();
      setTrainingLogs(data.logs || []);
    };
    fetchLogs();
  }, []);

  useEffect(() => {
    const fetchCheckinHistory = async () => {
      try {
        const res = await fetch('/api/get-checkins?userId=user-123'); // Replace with actual user ID
        if (res.ok) {
          const data = await res.json();
          setCheckinHistory(data.checkins);
          if (data.checkins.length > 0) {
            const latest = data.checkins[0];
            setLatestFrontPhoto(latest.exercises.frontPhotoUrl);
            setBodyFat(latest.exercises.bodyFat);
            setLeanBodyMass(latest.exercises.leanBodyMass);
            setLatestSidePhoto(latest.exercises.sidePhotoUrl || '');
            setLatestBackPhoto(latest.exercises.backPhotoUrl || '');
          }
        }
      } catch (error) {
        console.error('Failed to fetch check-in history:', error);
      }
    };
    fetchCheckinHistory();

    setGoalWeight(localStorage.getItem('goalWeight'));
    setGoalBodyFat(localStorage.getItem('goalBodyFat'));
    setTrainingDays(localStorage.getItem('trainingDays'));

    const fetchTodayWorkout = async () => {
      const res = await fetch('/api/training/today?userId=user-123'); // dynamic auth later
      const data = await res.json();
      setTodayWorkout(data.workout);
      setTodayQueueIndex(data.queueIndex);
    };

    fetchTodayWorkout();
  }, []);

  const getPhase = () => {
    const currentWeight = parseFloat(leanBodyMass) / (1 - parseFloat(bodyFat) / 100);
    const goal = parseFloat(goalWeight);
    if (!goal || !currentWeight || isNaN(currentWeight)) return '';
    if (currentWeight > goal + 2) return 'cutting';
    if (currentWeight < goal - 2) return 'bulking';
    return 'recomp';
  };
  const [premiumUser, setPremiumUser] = useState(false);
  const [anabolicQuestion, setAnabolicQuestion] = useState('');
  const [consultHistory, setConsultHistory] = useState([]);
  const [allConsults, setAllConsults] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const checkUserRole = async () => {
      const res = await fetch('/api/user/role');
      if (res.ok) {
        const data = await res.json();
        setPremiumUser(data.role === 'premium');
        setIsAdmin(data.role === 'admin');
      }
    };
    checkUserRole();
  }, []);

  useEffect(() => {
    const loadConsultMessages = async () => {
      const res = await fetch('/api/consult/history?userId=user-123');
      if (res.ok) {
        const data = await res.json();
        setConsultHistory(data.messages);
      }
    };
    loadConsultMessages();
  }, []);

  useEffect(() => {
    const fetchAllConsults = async () => {
      const res = await fetch('/api/consult/all');
      if (res.ok) {
        const data = await res.json();
        setAllConsults(data.messages || []);
      }
    };
    fetchAllConsults();
  }, []);
  const [chatMessages, setChatMessages] = useState([]);
  useEffect(() => {
    const loadChatHistory = async () => {
      const res = await fetch('/api/chat/history?userId=user-123');
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.messages || []);
      }
    };
    loadChatHistory();
  }, []);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);
  
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;
  
    const newMessages = [...chatMessages, { role: 'user', content: chatInput }];
    setChatMessages(newMessages);
    setChatInput('');
    setIsLoading(true);
  
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages })
    });
  
    const data = await res.json();
    const updatedMessages = [...newMessages, { role: 'assistant', content: data.reply }];
    setChatMessages(updatedMessages);
    await fetch('/api/chat/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'user-123',
        messages: updatedMessages
      })
    });
    setIsLoading(false);
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            <div className="bg-zinc-900 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">Latest Check-In</h2>
              <div className="flex justify-center space-x-2 mb-4">
                {latestFrontPhoto && (
                  <Image src={latestFrontPhoto} alt="Latest Front" width={300} height={300} className="w-1/4 rounded border border-gray-600" />
                )}
                {latestSidePhoto ? (
                  <Image src={latestSidePhoto} alt="Latest Side" width={300} height={300} className="w-1/4 rounded border border-gray-600" />
                ) : null}
                {latestBackPhoto ? (
                  <Image src={latestBackPhoto} alt="Latest Back" width={300} height={300} className="w-1/4 rounded border border-gray-600" />
                ) : null}
              </div>
              <p>Estimated Body Fat %: <span className="font-bold">{bodyFat}</span></p>
              <p>Estimated Lean Body Mass: <span className="font-bold">{leanBodyMass} lbs</span></p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">Manually Override Priorities</h2>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = new FormData(e.target);
                  const overrides = form.get('overrides').split(',').map(s => s.trim()).filter(Boolean);
                  const res = await fetch('/api/checkin/override-weakpoints', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'user-123', weakPoints: overrides })
                  });
                  if (res.ok) {
                    alert('Priority muscles updated.');
                    const updated = await fetch('/api/get-checkins?userId=user-123');
                    if (updated.ok) {
                      const data = await updated.json();
                      setCheckinHistory(data.checkins);
                    }
                  } else {
                    alert('Failed to update.');
                  }
                }}
              >
                <label className="block text-sm text-gray-400 mb-2">Enter muscle groups (comma-separated):</label>
                <input
                  name="overrides"
                  type="text"
                  placeholder="e.g. calves, rear delts, hamstrings"
                  className="w-full mb-2 p-2 rounded bg-zinc-800 border border-zinc-600 text-white"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold text-white"
                >
                  Save Overrides
                </button>
              </form>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">AI Coach</h2>
              <p className="text-gray-300">Ask questions, get feedback... (chat coming soon)</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">Today’s Training</h2>
              <p className="text-gray-300">Training plan logic coming soon...</p>
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">Your Goal</h2>
              <p>Ideal Body Weight: <span className="font-bold">{goalWeight} lbs</span></p>
              <p>Target Body Fat %: <span className="font-bold">{goalBodyFat}%</span></p>
              <p>Training Days / Week: <span className="font-bold">{trainingDays}</span></p>
            </div>
            <div className="bg-zinc-900 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">Priority Muscle Groups</h2>
              {checkinHistory[0]?.weakPointAnalyzedAt && (
                <p className="text-sm text-gray-400 mb-2">
                  Last analyzed: {new Date(checkinHistory[0].weakPointAnalyzedAt).toLocaleDateString()}
                </p>
              )}
              {checkinHistory[0]?.weakPoints?.length > 0 ? (
                <ul className="list-disc list-inside text-gray-300">
                  {checkinHistory[0].weakPoints.map((muscle, i) => (
                    <li key={i}>{muscle}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400">No weak points identified yet.</p>
              )}
            </div>

            <div className="bg-zinc-900 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-orange-400 mb-2">Nutrition Summary</h2>
              {!nutrition ? (
                <p className="text-gray-300">Loading...</p>
              ) : (
                <>
                  <p>Calories: <span className="font-bold">{nutrition.data.calories}</span></p>
                  <p>Protein: <span className="font-bold">{nutrition.data.protein}g</span></p>
                  <p>Carbs: <span className="font-bold">{nutrition.data.carbs}g</span></p>
                  <p>Fats: <span className="font-bold">{nutrition.data.fats}g</span></p>
                  {nutrition.data.adjustmentNote && (
                    <p className="italic text-yellow-300 text-sm mt-2">💡 {nutrition.data.adjustmentNote}</p>
                  )}
                </>
              )}
            </div>
          </div>
        );

      case 'checkins':
        return (
          <React.Fragment>
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-orange-400">Weekly Check-ins</h2>
                <button
                  className="bg-orange-600 hover:bg-orange-700 px-4 py-2 rounded-md font-semibold text-white"
                  onClick={() => router.push('/intake/front-photo')}
                >
                  + New Check-in
                </button>
              </div>
              <div className="space-y-4">
                {checkinHistory.length === 0 ? (
                  <p className="text-gray-400">No check-ins yet.</p>
                ) : (
                  <>
                    {checkinHistory.length > 1 && (
                      <div className="bg-zinc-900 p-4 rounded-md shadow-md mb-6">
                        <h3 className="text-lg font-semibold text-orange-400 mb-2">Progress Overview</h3>
                        <Line
                          data={{
                            labels: checkinHistory.map((entry, i) => `W${checkinHistory.length - i}`),
                            datasets: [
                              {
                                label: 'Body Fat %',
                                data: checkinHistory.map((c) => parseFloat(c.bodyFat)),
                                borderColor: '#f87171',
                                backgroundColor: 'rgba(248, 113, 113, 0.2)',
                                tension: 0.3
                              },
                              {
                                label: 'Lean Body Mass (lbs)',
                                data: checkinHistory.map((c) => parseFloat(c.leanBodyMass)),
                                borderColor: '#34d399',
                                backgroundColor: 'rgba(52, 211, 153, 0.2)',
                                tension: 0.3
                              }
                            ]
                          }}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: { labels: { color: 'white' } }
                            },
                            scales: {
                              x: { ticks: { color: 'white' } },
                              y: { ticks: { color: 'white' } }
                            }
                          }}
                        />
                      </div>
                    )}
                    {checkinHistory.slice(0, -1).map((entry, index) => (
                      <div key={index} className="bg-zinc-800 p-4 rounded-md shadow flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-6">
                        <div className="flex space-x-2">
                          {entry.frontPhotoUrl && (
                            <Image src={entry.frontPhotoUrl} alt={`Front Check-in ${index}`} width={300} height={300} className="w-1/4 rounded border border-gray-600" />
                          )}
                          {entry.sidePhotoUrl && (
                            <Image src={entry.sidePhotoUrl} alt={`Side Check-in ${index}`} width={300} height={300} className="w-1/4 rounded border border-gray-600" />
                          )}
                          {entry.backPhotoUrl && (
                            <Image src={entry.backPhotoUrl} alt={`Back Check-in ${index}`} width={300} height={300} className="w-1/4 rounded border border-gray-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-400 mb-2">{new Date(entry.date).toLocaleDateString()}</p>
                          <table className="text-sm w-full text-left border-collapse">
                            <tbody>
                              <tr>
                                <td className="pr-4 text-orange-400 font-semibold">Estimated Body Fat %:</td>
                                <td>{entry.bodyFat}</td>
                              </tr>
                              <tr>
                                <td className="pr-4 text-orange-400 font-semibold">Estimated Lean Body Mass:</td>
                                <td>{entry.leanBodyMass} lbs</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      case 'nutrition':
        return (
          <div className="mt-6 text-gray-300">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">Nutrition Plan</h2>
            {(() => {
              const phase = getPhase();
              const badgeStyle = "inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide";
              return (
                <div className="mb-4">
                  {phase === 'cutting' && <span className={`${badgeStyle} bg-red-600 text-white`}>Cutting Phase</span>}
                  {phase === 'bulking' && <span className={`${badgeStyle} bg-green-600 text-white`}>Bulking Phase</span>}
                  {phase === 'recomp' && <span className={`${badgeStyle} bg-yellow-500 text-black`}>Recomp Phase</span>}
                </div>
              );
            })()}
            {!nutrition ? (
              <p>Loading AI-optimized plan...</p>
            ) : (
              <div className="bg-zinc-900 p-6 rounded-lg space-y-3">
                <p><span className="text-orange-400 font-semibold">Calories:</span> {nutrition.data.calories}</p>
                <p><span className="text-orange-400 font-semibold">Protein:</span> {nutrition.data.protein}g</p>
                <p><span className="text-orange-400 font-semibold">Carbs:</span> {nutrition.data.carbs}g</p>
                <p><span className="text-orange-400 font-semibold">Fats:</span> {nutrition.data.fats}g</p>
                {nutrition.data.adjustmentNote && (
                  <p className="mt-2 italic text-sm text-yellow-300">💡 {nutrition.data.adjustmentNote}</p>
                )}
                {(() => {
                  const phase = getPhase();
                  return (
                    <>
                      {phase === 'cutting' && (
                        <p className="text-sm text-gray-400 mt-4">
                          🔥 You&apos;re in a fat loss phase. Stick to your deficit and prioritize high protein to preserve lean mass.
                        </p>
                      )}
                      {phase === 'bulking' && (
                        <p className="text-sm text-gray-400 mt-4">
                          📈 You&apos;re in a growth phase. Your current macros support lean muscle gain. Stay consistent with training intensity.
                        </p>
                      )}
                      {phase === 'recomp' && (
                        <p className="text-sm text-gray-400 mt-4">
                          ⚖️ You&apos;re close to your goal weight — maintain a balanced intake while fine-tuning your body composition.
                        </p>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
          </div>
        );
      case 'mealplan':
        return (
          <div className="mt-6 text-white">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">Your AI-Powered Meal Plan</h2>
            {savedMealPlans.length > 0 && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 mr-2">View Saved Plan:</label>
                <select
                  className="bg-zinc-800 text-white border border-zinc-700 rounded px-2 py-1"
                  onChange={(e) => {
                    const selected = savedMealPlans.find(p => p.id === e.target.value);
                    if (selected) {
                      setMealPlan(JSON.parse(selected.data));
                    }
                  }}
                >
                  <option value="">Select a date</option>
                  {savedMealPlans.map((plan, i) => (
                    <option key={plan.id} value={plan.id}>
                      {plan.isFavorite ? '⭐ ' : ''}
                      {plan.name ? `${plan.name} (${new Date(plan.createdAt).toLocaleDateString()})` : new Date(plan.createdAt).toLocaleDateString()}
                      {i === 0 ? ' (Active)' : ' (Historical)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex space-x-4 mb-6">
            <div className="mb-4 flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
  <input
    type="text"
    placeholder="Plan name (optional)"
    value={mealPlan?.name || ''}
    onChange={(e) => {
      const updated = { ...mealPlan, name: e.target.value };
      setMealPlan(updated);
    }}
    className="bg-zinc-800 border border-zinc-600 px-3 py-2 rounded-md text-white w-full md:w-1/2"
  />
  <label className="text-sm text-gray-300">
    <input
      type="checkbox"
      className="mr-2"
      checked={mealPlan?.isFavorite || false}
      onChange={(e) => {
        const updated = { ...mealPlan, isFavorite: e.target.checked };
        setMealPlan(updated);
      }}
    />
    Mark as Favorite
  </label>
</div>
              <button
                onClick={async () => {
                  const res = await fetch('/api/mealplan/generate', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: 'user-123' })
                  });
                  if (res.ok) {
                    const data = await res.json();
                    setMealPlan(data.plan);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold text-white"
              >
                🔄 Regenerate Plan
              </button>

              <button
                onClick={async () => {
                  const res = await fetch('/api/mealplan/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      userId: 'user-123',
                      plan: mealPlan,
                      name: mealPlan?.name || '',
                      isFavorite: mealPlan?.isFavorite || false
                    })
                  });
                  if (res.ok) {
                    alert('Meal plan saved!');
                  } else {
                    alert('Failed to save meal plan.');
                  }
                }}
                className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-md font-semibold text-white"
              >
                💾 Save Plan
              </button>
            </div>
            {!mealPlan ? (
              <p className="text-gray-300">Loading meal plan...</p>
            ) : (
              <div className="space-y-6">
                {mealPlan.meals.map((meal, i) => (
                  <div key={i} className="bg-zinc-900 p-4 rounded-lg">
                    <h3 className="text-xl text-orange-300 font-bold mb-2">{meal.name}</h3>
                    <ul className="space-y-1">
                      {meal.items.map((item, j) => (
                        <li key={j} className="text-sm text-gray-300">
                          • {item.name} — {item.protein}g P / {item.carbs}g C / {item.fats}g F ({item.calories} kcal)
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'training': {
        const isRestDay = parseInt(trainingDays) === 0;
        const workoutToDisplay = JSON.parse(localStorage.getItem('activeCustomWorkout')) || todayWorkout;
        return (
          <div className="mt-6">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">Training</h2>
            <div className="flex justify-end mb-6 space-x-4">
              <button
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md font-semibold text-white"
                onClick={() => {
                  setCustomName('');
                  setCustomExercises([{ name: '', sets: 3, reps: [10, 12] }]);
                  setSelectedWorkoutIndex(null);
                  setShowCustomModal(true);
                }}
              >
                + Custom Workout
              </button>
              <button
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-md font-semibold text-white"
                onClick={async () => {
                  const res = await fetch('/api/training/custom/list?userId=user-123');
                  if (res.ok) {
                    const data = await res.json();
                    setCustomWorkouts(data.workouts || []);
                    setShowCustomModal(true);
                  }
                }}
              >
                🗂 Manage Workouts
              </button>
            </div>
            {showCustomModal && (
              <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                <div className="bg-zinc-900 p-6 rounded-lg shadow-lg max-w-md w-full">
                  <h2 className="text-xl text-orange-400 font-bold mb-4">Create Custom Workout</h2>
                  <input
                    type="text"
                    placeholder="Workout Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full mb-4 p-2 rounded bg-zinc-800 text-white"
                  />
                  {customExercises.map((ex, i) => (
                    <div key={i} className="mb-4 space-y-1">
                      <input
                        type="text"
                        placeholder="Exercise Name"
                        value={ex.name}
                        onChange={(e) => {
                          const updated = [...customExercises];
                          updated[i].name = e.target.value;
                          setCustomExercises(updated);
                        }}
                        className="w-full p-2 rounded bg-zinc-800 text-white"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="number"
                          placeholder="Sets"
                          value={ex.sets}
                          onChange={(e) => {
                            const updated = [...customExercises];
                            updated[i].sets = parseInt(e.target.value);
                            setCustomExercises(updated);
                          }}
                          className="w-1/3 p-2 rounded bg-zinc-800 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Min Reps"
                          value={ex.reps[0]}
                          onChange={(e) => {
                            const updated = [...customExercises];
                            updated[i].reps[0] = parseInt(e.target.value);
                            setCustomExercises(updated);
                          }}
                          className="w-1/3 p-2 rounded bg-zinc-800 text-white"
                        />
                        <input
                          type="number"
                          placeholder="Max Reps"
                          value={ex.reps[1]}
                          onChange={(e) => {
                            const updated = [...customExercises];
                            updated[i].reps[1] = parseInt(e.target.value);
                            setCustomExercises(updated);
                          }}
                          className="w-1/3 p-2 rounded bg-zinc-800 text-white"
                        />
                      </div>
                    </div>
                  ))}
                  <button
                    className="text-sm text-blue-400 hover:underline mb-4"
                    onClick={() =>
                      setCustomExercises([...customExercises, { name: '', sets: 3, reps: [10, 12] }])
                    }
                  >
                    + Add Exercise
                  </button>
                  <div className="flex justify-end space-x-2">
                    <button
                      className="px-4 py-2 rounded bg-gray-700 text-white"
                      onClick={() => setShowCustomModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-4 py-2 rounded bg-orange-600 text-white font-semibold"
                      onClick={async () => {
                        const res = await fetch('/api/training/custom/save', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            userId: 'user-123',
                            name: customName,
                            exercises: customExercises,
                          }),
                        });
                        if (res.ok) {
                          alert('Workout saved!');
                          setShowCustomModal(false);
                        } else {
                          alert('Failed to save workout.');
                        }
                      }}
                    >
                      Save Workout
                    </button>
                  </div>
                </div>
              </div>
            )}
            {customWorkouts.length > 0 && (
              <div className="mt-8 space-y-6">
                <h3 className="text-lg text-orange-400 font-bold mb-2">Saved Workouts</h3>
                {customWorkouts.map((workout, idx) => (
                  <div key={idx} className="bg-zinc-800 p-4 rounded-md shadow text-white">
                    <h4 className="text-xl font-semibold text-orange-300 mb-2">{workout.name}</h4>
                    <ul className="mb-4">
                      {workout.exercises.map((ex, i) => (
                        <li key={i} className="text-sm text-gray-300">
                          • {ex.name}: {ex.sets} sets × {ex.reps[0]}–{ex.reps[1]} reps
                        </li>
                      ))}
                    </ul>
                    <div className="flex space-x-2">
                      <button
                        className="px-4 py-1 rounded bg-blue-600 text-white text-sm"
                        onClick={() => {
                          setSelectedWorkoutIndex(idx);
                          setCustomName(workout.name);
                          setCustomExercises(workout.exercises);
                          setShowCustomModal(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="px-4 py-1 rounded bg-red-600 text-white text-sm"
                        onClick={async () => {
                          const res = await fetch('/api/training/custom/delete', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId: 'user-123', index: idx }),
                          });
                          if (res.ok) {
                            const updated = await fetch('/api/training/custom/list?userId=user-123');
                            const updatedData = await updated.json();
                            setCustomWorkouts(updatedData.workouts || []);
                          } else {
                            alert('Failed to delete workout.');
                          }
                        }}
                      >
                        Delete
                      </button>
                      <button
                        className="px-4 py-1 rounded bg-green-600 text-white text-sm"
                        onClick={() => {
                          fetch('/api/training/custom/save', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              userId: 'user-123',
                              name: workout.name,
                              exercises: workout.exercises,
                            }),
                          }).then(() => {
                            alert('This workout is now active.');
                          });
                        }}
                      >
                        Use This Workout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isRestDay ? (
              <div className="bg-zinc-800 p-6 rounded-lg text-gray-300">
                <p className="mb-2">Today is a scheduled rest day.</p>
                <ul className="list-disc list-inside text-sm">
                  <li>Light stretching or yoga</li>
                  <li>Foam rolling or mobility work</li>
                  <li>Meditation or deep breathing</li>
                  <li>Focus on hydration and sleep</li>
                </ul>
              </div>
            ) : (
              <>
                <div className="bg-zinc-900 p-4 rounded-lg text-sm text-gray-300 mb-6">
                  <h3 className="text-orange-400 font-semibold mb-2">Pre-Workout Guidance</h3>
                  <p>At the start of your workout, perform 1–2 warm-up sets at 50–75% of your working weight for your first main exercise. This prepares your body and joints for the working sets ahead.</p>
                </div>
                <div className="space-y-6">
                  {(workoutToDisplay?.exercises || []).map((exercise, i) => (
                    <div key={i} className="bg-zinc-800 p-4 rounded-md shadow text-white">
                      <h4 className="text-lg font-semibold text-orange-300 mb-2">{exercise.name}</h4>
                      <p className="text-sm text-gray-400 mb-2">
                        Recommended: {exercise.sets} sets x {exercise.reps[0]}–{exercise.reps[1]} reps
                      </p>
                      <div className="mb-4">
                        <div className="bg-zinc-900 p-3 rounded-md border border-zinc-700">
                          <p className="text-gray-400 text-sm italic mb-1">
                            Want to learn how to do &quot;{exercise.name}&quot;?
                          </p>
                          <input
                            type="text"
                            className="w-full p-2 rounded bg-zinc-800 border border-zinc-600 text-white text-sm"
                            placeholder={`Ask: How do I perform ${exercise.name}?`}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                const query = `How do I perform ${exercise.name}`;
                                window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`, '_blank');
                              }
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        {Array.from({ length: exercise.sets }).map((_, idx) => (
                          <div key={idx} className="flex space-x-2">
                            <input
                              type="number"
                              placeholder="Weight (lbs)"
                              className="w-1/2 p-2 rounded bg-zinc-900 border border-zinc-600 text-white"
                            />
                            <input
                              type="number"
                              placeholder="Reps"
                              className="w-1/2 p-2 rounded bg-zinc-900 border border-zinc-600 text-white"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4">
                  <button
                    className="text-sm text-blue-400 hover:text-blue-500 underline"
                    onClick={() => {
                      const aiCustom = {
                        name: `Edited AI Plan – Day ${todayQueueIndex + 1}`,
                        exercises: todayWorkout?.exercises || [],
                      };
                      setCustomName(aiCustom.name);
                      setCustomExercises(aiCustom.exercises);
                      setSelectedWorkoutIndex(null);
                      setShowCustomModal(true);
                    }}
                  >
                    Edit This AI-Generated Workout
                  </button>
                </div>
                <div className="mt-6 text-center">
                  <button
                    className="bg-orange-600 hover:bg-orange-700 px-6 py-3 rounded-md font-semibold text-white"
                    onClick={async () => {
                      const userId = 'user-123';
                      const dayIndex = todayQueueIndex;
                      const exerciseData = [];
                      // Grab all exercise cards
                      const cards = document.querySelectorAll('.bg-zinc-800.shadow');
                      cards.forEach((card) => {
                        const name = card.querySelector('h4')?.textContent || '';
                        const weights = Array.from(card.querySelectorAll('input[placeholder="Weight (lbs)"]')).map(input => parseFloat(input.value));
                        const reps = Array.from(card.querySelectorAll('input[placeholder="Reps"]')).map(input => parseInt(input.value));
                        const sets = weights.map((w, i) => ({
                          weight: w || 0,
                          reps: reps[i] || 0,
                        }));
                        exerciseData.push({ name, sets });
                      });
                      // Save to backend
                      await fetch('/api/training/logs', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId, dayIndex, exercises: exerciseData }),
                      });
                      // Advance workout queue
                      const advanceRes = await fetch('/api/training/advance', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ userId }),
                      });
                      if (advanceRes.ok) {
                        const todayRes = await fetch(`/api/training/today?userId=${userId}`);
                        const todayData = await todayRes.json();
                        setTodayWorkout(todayData.workout);
                        setTodayQueueIndex(todayData.queueIndex);
                      } else {
                        alert('Error advancing workout. Please try again.');
                      }
                    }}
                  >
                    Complete Workout
                  </button>
                </div>
              </>
            )}
          </div>
        );
      }

      case 'coach':
          if (!premiumUser) {
            return (
              <div className="mt-6 text-white">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">ForgeIQ AI Coach</h2>
                <p className="text-gray-400">This feature is available to Premium users only.</p>
              </div>
            );
          }
          return (
            <div className="mt-6 text-white">
              <h2 className="text-2xl font-bold text-orange-400 mb-4">ForgeIQ AI Coach</h2>
        
              <div className="bg-zinc-900 p-4 rounded-md mb-4 max-h-[400px] overflow-y-auto space-y-2">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-blue-300' : 'text-green-400'}`}>
                    <strong>{msg.role === 'user' ? 'You:' : 'Coach:'}</strong> {msg.content}
                  </div>
                ))}
                {isLoading && <p className="text-yellow-400 text-sm">Thinking...</p>}
                <div ref={chatEndRef} />
              </div>
        
              <div className="flex space-x-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendChatMessage()}
                  className="flex-1 p-2 bg-zinc-800 border border-zinc-700 rounded text-white"
                  placeholder="Ask me anything about training or nutrition..."
                />
                <button
                  onClick={sendChatMessage}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded"
                >
                  Send
                </button>
              </div>
            </div>
          );
 
      case 'anabolic':
        if (!premiumUser) {
          return (
            <div className="mt-6 text-white">
              <h2 className="text-2xl font-bold text-orange-400 mb-4">Anabolic Consulting</h2>
              <p className="text-gray-400">This feature is available to Premium users only.</p>
            </div>
          );
        }
        return (
          <div className="mt-6 text-white">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">Anabolic Consulting</h2>
            <p className="text-sm text-gray-300 mb-4">
              Ask your direct question here. This message will be forwarded to the ForgeIQ medical team for a personalized response.
            </p>
            <div className="bg-zinc-900 p-4 rounded mb-4 max-h-[300px] overflow-y-auto space-y-2">
              {consultHistory.length > 0 ? (
                consultHistory.map((msg) => (
                  <div key={msg.id} className={`text-sm ${msg.sender === 'admin' ? 'text-green-400' : 'text-blue-300'}`}>
                    <strong>{msg.sender === 'admin' ? 'Coach:' : 'You:'}</strong> {msg.message}
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm">No messages yet.</p>
              )}
            </div>
            <textarea
              rows="6"
              className="w-full p-4 bg-zinc-800 text-white border border-zinc-600 rounded mb-4"
              placeholder="Enter your anabolic-related question or concern..."
              onChange={(e) => setAnabolicQuestion(e.target.value)}
              value={anabolicQuestion}
            />
            <button
              onClick={async () => {
                const res = await fetch('/api/consult/send', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ userId: 'user-123', message: anabolicQuestion })
                });
                if (res.ok) {
                  alert('Message sent to admin. You will receive a response soon.');
                  setAnabolicQuestion('');
                } else {
                  alert('Failed to send your message.');
                }
              }}
              className="bg-orange-600 hover:bg-orange-700 px-6 py-2 rounded font-semibold text-white"
            >
              Submit Question
            </button>
          </div>
        );

      case 'history':
        return (
          <div className="mt-6 text-white">
            <h2 className="text-2xl font-bold text-orange-400 mb-6">Training History</h2>
            <div className="space-y-6">
              {customWorkouts.map((workout, i) => (
                <div key={i} className="bg-zinc-800 p-4 rounded-md shadow-md">
                  <h3 className="text-xl font-semibold text-orange-300 mb-2">{workout.name || `Workout ${i + 1}`}</h3>
                  {workout.exercises.map((exercise, idx) => {
                    const logs = trainingLogs
                      .filter((log) => log.exercises.find((ex) => ex.name === exercise.name))
                      .map((log, i) => {
                        const matched = log.exercises.find((ex) => ex.name === exercise.name);
                        const totalVolume = matched.sets.reduce((sum, set) => sum + (set.weight * set.reps), 0);
                        return { week: `W${i + 1}`, volume: totalVolume };
                      });
  
                    const chartData = {
                      labels: logs.map((entry) => entry.week),
                      datasets: [
                        {
                          label: 'Total Volume',
                          data: logs.map((entry) => entry.volume),
                          borderColor: '#f97316',
                          backgroundColor: 'rgba(249, 115, 22, 0.3)',
                          tension: 0.4,
                        },
                      ],
                    };
  
                    return (
                      <div key={idx} className="mb-4">
                        <p className="text-white font-semibold">{exercise.name}</p>
                        <div className="bg-zinc-900 rounded p-2">
                          <Line data={chartData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );

      case 'adminconsult':
        return (
          <div className="mt-6 text-white">
            <h2 className="text-2xl font-bold text-orange-400 mb-4">Anabolic Consultation – Admin View</h2>
            {allConsults.length === 0 ? (
              <p className="text-gray-500">No messages available.</p>
            ) : (
              (() => {
                const sortedConsults = [...allConsults].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const repliedSet = new Set(
                  allConsults
                    .filter((m) => m.sender === 'admin')
                    .map((m) => `${m.userId}:${m.message}`)
                );
                return sortedConsults.map((msg) => {
                  const isUnread = msg.sender === 'user' && !repliedSet.has(`${msg.userId}:${msg.message}`);
                  return (
                    <div key={msg.id} className={`bg-zinc-800 p-4 rounded-lg mb-4 ${isUnread ? 'border-l-4 border-yellow-400' : ''}`}>
                      <p className="text-sm text-gray-400 mb-1"><strong>User:</strong> {msg.userId}</p>
                      <p className={`text-sm ${msg.sender === 'admin' ? 'text-green-400' : 'text-blue-300'}`}>
                        <strong>{msg.sender === 'admin' ? 'Coach:' : 'User:'}</strong> {msg.message}
                      </p>
                      {msg.sender === 'user' && (
                        <form
                          className="mt-2"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const form = new FormData(e.target);
                            const reply = form.get('reply');
                            if (!reply) return;
                            const res = await fetch('/api/consult/reply', {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                userId: msg.userId,
                                message: reply
                              })
                            });
                            if (res.ok) {
                              alert('Reply sent.');
                              e.target.reset();
                            } else {
                              alert('Failed to send reply.');
                            }
                          }}
                        >
                          <input
                            name="reply"
                            type="text"
                            placeholder="Type your reply..."
                            className="w-full mt-2 p-2 rounded bg-zinc-700 text-white"
                          />
                          <button
                            type="submit"
                            className="mt-2 bg-green-600 hover:bg-green-700 px-4 py-1 rounded text-white font-semibold"
                          >
                            Send Reply
                          </button>
                        </form>
                      )}
                    </div>
                  );
                });
              })()
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white px-6 py-10">
      <h1 className="text-4xl font-bold text-orange-500 mb-6">Welcome to Your Dashboard</h1>

      <div className="flex space-x-4 border-b border-zinc-700 pb-2">
        <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'home' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('home')}
        >
          Home
        </button>
        <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'checkins' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('checkins')}
        >
          Check-ins
        </button>
        <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'nutrition' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('nutrition')}
        >
          Nutrition Summary
        </button>
        <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'mealplan' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('mealplan')}
        >
          Meal Plan
        </button>
        <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'training' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('training')}
        >
          Training
        </button>
        <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'coach' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('coach')}
        >
          AI Coach
        </button>
      <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'anabolic' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('anabolic')}
        >
          Anabolic Consulting
        </button>
      {isAdmin && (
        <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'adminconsult' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('adminconsult')}
        >
          Admin Consult
        </button>
        )}
        <button
          className={`pb-2 px-3 font-semibold ${activeTab === 'history' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-gray-400 hover:text-white'}`}
          onClick={() => setActiveTab('history')}
        >
          Training History
        </button>
      </div>

      {renderTabContent()}
    </div>