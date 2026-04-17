Struttura titolo. Quali sono le convenzioni di denominazione?
-------------------------------------------------------------

Introduzione
------------

Nell'interesse di una ricerca efficiente e della coerenza del sito, ItaTorrents ha rigide convenzioni di denominazione. Si prega di nominare il torrent in loco utilizzando il seguente standard.

Struttura Titolo per: Full Disc, Remux
--------------------------------------

`Name` `Year` `S##E##` `Cut` `REPACK` `Resolution` `Edition` `Region` `3D` `SOURCE` `TYPE` `Hi10P` `HDR` `VCodec` `Dub` `ACodec` `Channels` `Object`\-`Tag`

Struttura Titolo per: Encode, WEB-DL, WEBRip, HDTV, DLMux, BDMux, WEBMux, DVDMux, BDRip, DVDRip
-----------------------------------------------------------------------------------------------

`Name` `Year` `S##E##` `Cut` `REPACK` `Resolution` `Edition` `3D` `SOURCE` `TYPE` `Dub` `ACodec` `Channels` `Object` `Hi10P` `HDR` `VCodec`\-`Tag`

Informazioni Struttura Titolo
-----------------------------

*   **Name**: Il nome del titolo riconosciuto a livello internazionale (solitamente reperibile su TMDB, a meno che non sia errato). Devono essere inclusi tutti i segni di punteggiatura, inclusi due punti, apostrofi e virgole.
*   **Year**: Anno di uscita secondo TMDB. I contenuti TV includono l'anno solo se esistono più serie con lo stesso nome.
*   **S##E##**: Stagione e numero dell'episodio, se applicabile.
    *   Per singolo episodio, utilizza: `S##E##`.
    *   Per doppio episodio, utilizza: `S##E##E##`.
    *   Per più episodi di un stagione non ancora conclusa, utilizza: `S##E##-##`.
    *   Per gli extra, utilizza: `S## Extras`.
*   **Cut** (Se omesso, si presume che sia teatrale, altrimenti, ad esempio: `Director’s Cut`, `Extended`, `Special Edition`, `Unrated`, `Uncut`, `Super Duper Cut`).
*   **Resolution** (Uno tra: `480i`, `480p`, `576i`, `576p`, `720p`, `1080i`, `1080p`, `2160p`, `4320p`): Risoluzione video.
*   **Edition** (`XXth Anniversary Edition`, `Remastered`, `4K Remaster`, `Criterion Collection`, `Limited`): **Ometti dal nome** e inserisci nella descrizione. Tuttavia, solo i dischi possono includere il distributore, ad esempio `Criterion Collection`. Anche i contenuti FanRes richiedono il processo utilizzato nel restauro (ad esempio `DNR`, `RECONSTRUCTED`, `RECUT`, `REEDIT`, `REGRADE`, `RESCAN`, `RESTORED`, `UPSCALED`). Il nome del FanRes è incluso nel `Cut`.
*   **Region** (Il codice di 3 lettere): Paese di uscita del disco. **Incluso solo per i dischi**.
*   **Source**: Video source.
    *   Per i dischi, uno tra: `NTSC DVD5`, `NTSC DVD9`, `PAL DVD5`, `PAL DVD9`, `HD DVD`, `Blu-ray`, `3D Blu-ray`, `UHD Blu-ray`.
    *   Per i Remux e Encode, uno tra: `NTSC DVD`, `PAL DVD`, `HDDVD`, `3D BluRay`, `BluRay`, `UHD BluRay`.
    *   Per web-dl e webrip: abbreviazione del provider del servizio di streaming.
    *   Per HDTV, uno tra: `HDTV`, `UHDTV`.
*   **Type** (Omesso per Full Disc, Encode e HDTV. Altrimenti, uno tra: `REMUX`, `WEB-DL`, `WEBRip`).
*   **HDR** (Se omesso, si presume SDR, altrimenti, uno tra: `HDR`, `HDR10+`, `DV HDR`, `DV`, `DV HDR10+`, `HLG`, `PQ10`).
*   **Hi10P**: Profondità di bit SDR di 10 bit AVC/H.264/x264.
*   **VCodec**: Codec video. **Omettere per le versioni DVD**.
    *   Per Full Disc e Remux, uno tra: `MPEG-2`, `VC-1`, `AVC`, `HEVC`.
    *   Per WEB-DL e HDTV non modificata, uno tra: `H.264`, `H.265`, `VP9`, `MPEG-2`.
    *   Per Encode, WEBRip e HDTV codificata, uno tra: `x264`, `x265`.
*   **Dub** (Una o più tracce audio: `ITA`, `ENG` `SPA` `GER` `KOR`, etc): includere qualsiasi traccia audio presente..
*   **ACodec** (Uno tra: `DD`, `DD EX`, `DD+`, `DD+ EX`, `TrueHD`, `DTS`, `DTS-ES`, `DTS-HD MA`, `DTS-HD HRA`, `DTS:X`, `LPCM`, `FLAC`, `ALAC`, `AAC`, `Opus`): Codec audio della traccia audio predefinita.
*   **Channels** (Ad esempio `1.0`, `2.0`, `4.0`, `5.1`, `6.1`, `7.1`, `9.1`, `11.1`): canali audio della migliore traccia audio.
*   **Object** (Se omesso, si presume che non ne esista nessuno, altrimenti, uno tra: `Atmos`, `Auro3D`)
*   **Tag** (`UserName`, `ReleaseGroup`): il tag del gruppo di rilascio.