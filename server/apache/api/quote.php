<?php
// Quote form handler for classic hosting (cPanel / Apache with PHP). Same rules as api/quote.js (used on Vercel),
// sends with PHP mail() through the hosting's own mail server, so no password is stored here.
// GET /api/quote reports whether mail() is available.

$TO = 'office@frigofood.ro';   // who receives the requests (several: comma-separated)
$FROM = 'office@frigofood.ro'; // sender; must be a mailbox on this hosting, or the email may land in spam

ini_set('display_errors', '0'); // a PHP warning in the output would break the JSON answer; it still goes to the error log
header('Content-Type: application/json; charset=utf-8');
function out($code, $data) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($method === 'GET') out(200, ['ok' => true, 'mail' => function_exists('mail') ? 'php_mail' : 'not_configured']);
if ($method !== 'POST') { header('Allow: GET, POST'); out(405, ['error' => 'method']); }

// Only the site's own pages may post here.
$origin = $_SERVER['HTTP_ORIGIN'] ?? ($_SERVER['HTTP_REFERER'] ?? '');
$ownHost = preg_replace('/:\d+$/', '', $_SERVER['HTTP_HOST'] ?? '');
if ($origin !== '' && parse_url($origin, PHP_URL_HOST) !== $ownHost) out(403, ['error' => 'origin']);

$body = json_decode(file_get_contents('php://input') ?: '', true);
if (!is_array($body)) $body = $_POST;

function clean($v) { return trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/', '', is_scalar($v) ? (string) $v : '')); }
function oneLine($v) { return preg_replace('/[\r\n]+/', ' ', $v); }

// Spam traps: a hidden field people never fill, and a minimum time on the form.
if (clean($body['website'] ?? '') !== '') out(200, ['ok' => true]);
$started = (float) ($body['startedAt'] ?? 0);
if (!$started || microtime(true) * 1000 - $started < 4000) out(400, ['error' => 'too_fast']);

// ponytail: per-IP file counter in the temp folder (5 requests per 10 minutes); a shared store if spam gets through.
$file = sys_get_temp_dir() . '/ffquote_' . md5($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$now = time();
$hits = array_values(array_filter(json_decode(@file_get_contents($file) ?: '[]', true) ?: [], function ($t) use ($now) { return $now - $t < 600; }));
$hits[] = $now;
@file_put_contents($file, json_encode($hits));
if (count($hits) > 5) out(429, ['error' => 'rate_limited']);

// label, required, max length, type. Keep in step with FIELDS in api/quote.js.
$FIELDS = [
  'company' => ['Compania', true, 200],
  'person' => ['Persoana de contact', true, 200],
  'email' => ['E-mail', true, 200, 'email'],
  'phone' => ['Telefon', true, 40, 'phone'],
  'mode' => ['Tipul transportului', true, 10, 'mode'],
  'fromCountry' => ['Țara de încărcare', true, 80],
  'fromCity' => ['Localitatea de încărcare', true, 120],
  'fromPostcode' => ['Cod poștal încărcare', false, 20],
  'toCountry' => ['Țara de descărcare', true, 80],
  'toCity' => ['Localitatea de descărcare', true, 120],
  'toPostcode' => ['Cod poștal descărcare', false, 20],
  'loadDate' => ['Data estimată a încărcării', true, 10, 'date'],
  'deliverBy' => ['Data dorită a livrării', false, 10, 'date'],
  'goods' => ['Tipul mărfii', true, 120],
  'temp' => ['Temperatura de transport solicitată', true, 60],
  'pallets' => ['Numărul paleților', true, 10, 'int'],
  'palletSize' => ['Dimensiunile paleților', false, 120],
  'weight' => ['Greutatea totală (kg)', true, 20, 'number'],
  'special' => ['Cerințe speciale', false, 1500],
  'notes' => ['Observații', false, 3000],
];

$d = [];
$invalid = [];
foreach ($FIELDS as $name => $f) {
  $v = clean($body[$name] ?? '');
  if ($name !== 'special' && $name !== 'notes') $v = oneLine($v);
  $d[$name] = $v;
  if ($v === '') { if ($f[1]) $invalid[] = $name; continue; }
  $kind = $f[3] ?? '';
  $num = (float) str_replace(',', '.', $v);
  if (mb_strlen($v) > $f[2]) $invalid[] = $name;
  elseif ($kind === 'email' && !filter_var($v, FILTER_VALIDATE_EMAIL)) $invalid[] = $name;
  elseif ($kind === 'phone' && !preg_match('/^[+()\d\s.\/-]{6,40}$/', $v)) $invalid[] = $name;
  elseif ($kind === 'mode' && !in_array($v, ['FTL', 'Grupaj'], true)) $invalid[] = $name;
  elseif ($kind === 'date' && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $v)) $invalid[] = $name;
  elseif ($kind === 'int' && !(ctype_digit($v) && $num >= 1 && $num <= 1000)) $invalid[] = $name;
  elseif ($kind === 'number' && !(preg_match('/^\d+([.,]\d+)?$/', $v) && $num >= 1 && $num <= 100000)) $invalid[] = $name;
}
if ($d['loadDate'] && $d['deliverBy'] && $d['deliverBy'] < $d['loadDate']) $invalid[] = 'deliverBy';
$consent = $body['consent'] ?? null;
if ($consent !== true && $consent !== 'on') $invalid[] = 'consent';
if ($invalid) out(400, ['error' => 'invalid', 'fields' => array_values(array_unique($invalid))]);

$subject = mb_substr("Cerere ofertă {$d['mode']}: {$d['fromCity']}, {$d['fromCountry']} → {$d['toCity']}, {$d['toCountry']} ({$d['loadDate']})", 0, 250);
$lines = [];
foreach ($FIELDS as $name => $f) $lines[] = $f[0] . ': ' . ($d[$name] !== '' ? $d[$name] : '-');
$lines[] = 'Limba formularului: ' . (($body['lang'] ?? '') === 'en' ? 'EN' : 'RO');

$b64 = function ($s) { return '=?UTF-8?B?' . base64_encode($s) . '?='; };
$headers = [
  'From: ' . $b64('Formular frigofood.ro') . " <$FROM>",
  'Reply-To: ' . $b64(str_replace('"', '', $d['person'])) . " <{$d['email']}>",
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
];
if (!mail($TO, $b64($subject), implode("\n", $lines), implode("\r\n", $headers), '-f' . $FROM)) {
  error_log('quote mail failed');
  out(502, ['error' => 'send_failed']);
}
out(200, ['ok' => true]);
